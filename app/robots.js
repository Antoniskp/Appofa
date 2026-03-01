const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
