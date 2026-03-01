import { idSlug } from '@/lib/utils/slugify';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' },
  { url: '/news', priority: 0.9, changeFrequency: 'hourly' },
  { url: '/articles', priority: 0.8, changeFrequency: 'daily' },
  { url: '/polls', priority: 0.7, changeFrequency: 'daily' },
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

export default async function sitemap() {
  const articles = await fetchPublishedArticles();

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

  return [...staticEntries, ...articleEntries];
}
