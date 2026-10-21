export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://appofasi.gr').replace(/\/+$/, '');
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

export function pageMetadata(title, description, path) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website', siteName: 'Απόφαση', title, description, url,
      images: [{ url: DEFAULT_OG_IMAGE, alt: 'Απόφαση' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
