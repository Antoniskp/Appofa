import { idSlug } from '@/lib/utils/slugify';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' },
  { url: '/news', priority: 0.9, changeFrequency: 'hourly' },
  { url: '/articles', priority: 0.8, changeFrequency: 'daily' },
  { url: '/polls', priority: 0.7, changeFrequency: 'daily' },
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

async function fetchPublishedArticles() {
  try {
    const res = await fetch(
      `${API_URL}/api/articles?status=published&limit=1000&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.articles || [];
  } catch {
    return [];
  }
}

async function fetchPublicPolls() {
  try {
    const res = await fetch(
      `${API_URL}/api/polls?limit=1000&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function fetchPublicSuggestions() {
  try {
    const res = await fetch(
      `${API_URL}/api/suggestions?limit=1000&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function fetchPublicOrganizations() {
  try {
    const res = await fetch(
      `${API_URL}/api/organizations?limit=1000&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data?.organizations) ? json.data.organizations : [];
  } catch {
    return [];
  }
}

async function fetchPublicPersons() {
  try {
    const res = await fetch(
      `${API_URL}/api/persons?limit=1000&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data?.profiles) ? json.data.profiles : [];
  } catch {
    return [];
  }
}

async function fetchPublicLocations() {
  try {
    const res = await fetch(
      `${API_URL}/api/locations?limit=1000`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.locations) ? json.locations : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [articles, polls, suggestions, organizations, persons, locations] = await Promise.all([
    fetchPublishedArticles(),
    fetchPublicPolls(),
    fetchPublicSuggestions(),
    fetchPublicOrganizations(),
    fetchPublicPersons(),
    fetchPublicLocations(),
  ]);

  const staticEntries = STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${SITE_URL}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const articleEntries = articles.map((article) => {
    const basePath = article.type === 'news' ? '/news' : '/articles';
    const slug = idSlug(article.id, article.title);
    return {
      url: `${SITE_URL}${basePath}/${slug}`,
      lastModified: new Date(article.updatedAt || article.createdAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    };
  });

  const pollEntries = polls.map((poll) => ({
    url: `${SITE_URL}/polls/${idSlug(poll.id, poll.title)}`,
    lastModified: new Date(poll.updatedAt || poll.createdAt),
    changeFrequency: poll.status === 'active' ? 'daily' : 'weekly',
    priority: 0.6,
  }));

  const suggestionEntries = suggestions.map((suggestion) => ({
    url: `${SITE_URL}/suggestions/${suggestion.id}`,
    lastModified: new Date(suggestion.updatedAt || suggestion.createdAt),
    changeFrequency: suggestion.status === 'open' ? 'daily' : 'weekly',
    priority: 0.5,
  }));

  const organizationEntries = organizations
    .filter((organization) => organization.slug)
    .map((organization) => ({
      url: `${SITE_URL}/organizations/${organization.slug}`,
      lastModified: new Date(organization.updatedAt || organization.createdAt),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  const personEntries = persons
    .filter((profile) => profile.slug)
    .map((profile) => ({
      url: `${SITE_URL}/persons/${profile.slug}`,
      lastModified: new Date(profile.updatedAt || profile.createdAt),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  const locationEntries = locations
    .filter((location) => location.slug)
    .map((location) => ({
      url: `${SITE_URL}/locations/${location.slug}`,
      lastModified: new Date(location.updatedAt || location.createdAt),
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
