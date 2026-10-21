import { idSlug } from '@/lib/utils/slugify';

import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' },
  { url: '/news', priority: 0.9, changeFrequency: 'hourly' },
  { url: '/articles', priority: 0.8, changeFrequency: 'daily' },
  { url: '/polls', priority: 0.7, changeFrequency: 'daily' },
  ...['suggestions', 'civic-questions', 'analyses', 'organizations', 'locations', 'topics', 'calendar', 'videos', 'platform'].map((route) => ({ url: '/' + route, priority: 0.7, changeFrequency: 'daily' })),
  // Static info pages
  { url: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/mission', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/transparency', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/instructions', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/contribute', priority: 0.5, changeFrequency: 'monthly' },
  { url: '/become-moderator', priority: 0.4, changeFrequency: 'monthly' },
  { url: '/economy', priority: 0.6, changeFrequency: 'weekly' },
  { url: '/education', priority: 0.6, changeFrequency: 'weekly' },
  { url: '/price-comparison', priority: 0.6, changeFrequency: 'weekly' },
  { url: '/car-transfer', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/boat-transfer', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/property-transfer', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/rental-guide', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/kep-services', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/digital-services', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/taxation-guide', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/start-business', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/labor-market', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/dypa-unemployment', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/health-insurance', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/driving-license', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/consumer-rights', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { url: '/rules', priority: 0.4, changeFrequency: 'monthly' },
  { url: '/contact', priority: 0.4, changeFrequency: 'yearly' },
];

// Public endpoints enforce visibility. Follow pagination rather than assuming
// that a large limit bypasses each endpoint's page-size cap.
async function fetchPages(path, selectItems) {
  const items = new Map();
  for (let page = 1; page <= 100; page += 1) {
    const url = new URL(path, API_URL);
    url.searchParams.set('limit', '50');
    url.searchParams.set('page', String(page));
    url.searchParams.set('offset', String((page - 1) * 50));
    try {
      const res = await fetch(url.toString(), { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) });
      if (!res.ok) break;
      const json = await res.json();
      const batch = selectItems(json);
      if (!Array.isArray(batch) || !batch.length) break;
      const previousSize = items.size;
      for (const item of batch) items.set(item.id ?? item.slug, item);
      const pagination = json.pagination || json.data?.pagination;
      const totalPages = pagination?.totalPages ?? Math.ceil(pagination?.total / 50);
      if (items.size === previousSize || !Number.isFinite(totalPages) || page >= totalPages) break;
    } catch {
      break;
    }
  }
  // At most 5,000 entries per collection, keeping this sitemap below 50,000 URLs.
  return [...items.values()];
}

function lastModified(item) {
  const value = item.updatedAt || item.createdAt;
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? { lastModified: date } : {};
}

export default async function sitemap() {
  const [articles, polls, suggestions, organizations, persons, locations] = await Promise.all([
    fetchPages('/api/articles?status=published', (json) => json?.data?.articles),
    fetchPages('/api/polls', (json) => json?.data),
    fetchPages('/api/suggestions', (json) => json?.data),
    fetchPages('/api/organizations', (json) => json?.data?.organizations),
    fetchPages('/api/persons', (json) => json?.data?.profiles),
    fetchPages('/api/locations', (json) => json?.locations),
  ]);

  const staticEntries = STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${SITE_URL}${url}`,
    changeFrequency,
    priority,
  }));

  const articleEntries = articles.map((article) => {
    const basePath = article.type === 'news' ? '/news' : '/articles';
    const slug = idSlug(article.id, article.title);
    return {
      url: `${SITE_URL}${basePath}/${slug}`,
      ...lastModified(article),
      changeFrequency: 'weekly',
      priority: 0.6,
    };
  });

  const pollEntries = polls.map((poll) => ({
    url: `${SITE_URL}/polls/${idSlug(poll.id, poll.title)}`,
    ...lastModified(poll),
    changeFrequency: poll.status === 'active' ? 'daily' : 'weekly',
    priority: 0.6,
  }));

  const suggestionEntries = suggestions.map((suggestion) => ({
    url: `${SITE_URL}/suggestions/${suggestion.id}`,
    ...lastModified(suggestion),
    changeFrequency: suggestion.status === 'open' ? 'daily' : 'weekly',
    priority: 0.5,
  }));

  const organizationEntries = organizations
    .filter((organization) => organization.slug)
    .map((organization) => ({
      url: `${SITE_URL}/organizations/${organization.slug}`,
      ...lastModified(organization),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  const personEntries = persons
    .filter((profile) => profile.slug)
    .map((profile) => ({
      url: `${SITE_URL}/persons/${profile.slug}`,
      ...lastModified(profile),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  const locationEntries = locations
    .filter((location) => location.slug)
    .map((location) => ({
      url: `${SITE_URL}/locations/${location.slug}`,
      ...lastModified(location),
      changeFrequency: 'weekly',
      priority: location.type === 'country' ? 0.7 : 0.5,
    }));

  return [
    ...staticEntries,
    ...articleEntries,
    ...pollEntries,
    ...suggestionEntries,
    ...organizationEntries,
    ...personEntries,
    ...locationEntries,
  ];
}
