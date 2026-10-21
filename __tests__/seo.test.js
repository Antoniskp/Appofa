import { pageMetadata, serializeJsonLd, SITE_URL } from '@/lib/seo';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { generateMetadata as newsMetadata } from '@/app/news/[id]/page';
import { generateMetadata as articleMetadata } from '@/app/articles/[id]/page';
import { generateMetadata as suggestionMetadata } from '@/app/suggestions/[id]/page';

jest.mock('@/app/news/[id]/NewsDetailClient', () => () => null);
jest.mock('@/app/articles/[id]/ArticleDetailClient', () => () => null);
jest.mock('@/app/suggestions/[id]/SuggestionDetailClient', () => () => null);
jest.mock('next-intl/server', () => ({ getTranslations: async () => (key) => key }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('page metadata and crawler discovery use the same origin', () => {
  const metadata = pageMetadata('News', 'Latest news', '/news');
  expect(metadata.alternates).toEqual({ canonical: `${SITE_URL}/news` });
  expect(metadata.openGraph.url).toBe(metadata.alternates.canonical);
  expect(metadata.twitter.description).toBe('Latest news');
  expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
});

test('structured data cannot terminate its script element', () => {
  const payload = { headline: '</script><script>alert(1)</script>' };
  expect(serializeJsonLd(payload)).not.toContain('<');
  expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
});

test.each([newsMetadata, articleMetadata])('article metadata resolves promised route parameters', async (generate) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    data: { article: { id: 42, title: 'Public transport', summary: 'Better buses' } },
  }) });
  const result = await generate({ params: Promise.resolve({ id: '42-public-transport' }) });
  expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/articles\/42$/);
  expect(result.title).toBe('Public transport');
  expect(result.alternates.canonical).toContain('/42-public-transport');
});

test('suggestion metadata resolves promised parameters', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    data: { id: 17, title: 'Safer streets', body: 'More crossings' },
  }) });
  const result = await suggestionMetadata({ params: Promise.resolve({ id: '17' }) });
  expect(result.alternates.canonical).toBe(`${SITE_URL}/suggestions/17`);
  expect(result.title).toBe('Safer streets');
});

test('sitemap follows capped API pages, deduplicates and omits unknown dates', async () => {
  global.fetch = jest.fn(async (input) => {
    const url = new URL(input);
    if (url.pathname !== '/api/suggestions') return { ok: true, json: async () => ({}) };
    const page = Number(url.searchParams.get('page'));
    return { ok: true, json: async () => ({
      data: page === 1
        ? [{ id: 1, updatedAt: '2026-01-01' }]
        : [{ id: 1, updatedAt: '2026-01-01' }, { id: 2, updatedAt: 'invalid' }],
      pagination: { totalPages: 2 },
    }) };
  });
  const entries = await sitemap();
  expect(entries.filter((entry) => entry.url === `${SITE_URL}/suggestions/1`)).toHaveLength(1);
  expect(entries.find((entry) => entry.url === `${SITE_URL}/suggestions/2`)).not.toHaveProperty('lastModified');
  expect(entries.find((entry) => entry.url === `${SITE_URL}/`)).not.toHaveProperty('lastModified');
  expect(entries.some((entry) => entry.url === `${SITE_URL}/analyses`)).toBe(true);
  expect(global.fetch.mock.calls.some(([url]) => url.includes('page=2'))).toBe(true);
});

test('sitemap retains public static routes during API outages', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  const entries = await sitemap();
  expect(entries.some((entry) => entry.url === `${SITE_URL}/suggestions`)).toBe(true);
  expect(entries.every((entry) => !entry.lastModified)).toBe(true);
});

test('sitemap supports offset-based location pagination', async () => {
  global.fetch = jest.fn(async (input) => {
    const url = new URL(input);
    if (url.pathname !== '/api/locations') return { ok: true, json: async () => ({}) };
    const offset = Number(url.searchParams.get('offset'));
    return { ok: true, json: async () => ({
      locations: [{ id: offset + 1, slug: `place-${offset + 1}` }],
      pagination: { total: 51, offset, limit: 50 },
    }) };
  });
  const entries = await sitemap();
  expect(entries.some((entry) => entry.url === `${SITE_URL}/locations/place-51`)).toBe(true);
});
