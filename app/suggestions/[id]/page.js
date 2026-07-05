import SuggestionDetailClient from './SuggestionDetailClient';

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

async function fetchSuggestion(id) {
  try {
    const numericId = parseInt(id, 10);
    if (!numericId) return null;

    const res = await fetch(`${API_URL}/api/suggestions/${numericId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const suggestion = await fetchSuggestion(params.id);
  if (!suggestion) {
    return {
      title: 'Πρόταση | Απόφαση',
      alternates: { canonical: `${SITE_URL}/suggestions/${params.id}` },
    };
  }

  const canonicalUrl = `${SITE_URL}/suggestions/${suggestion.id}`;
  const description = suggestion.body || `Δείτε την πρόταση "${suggestion.title}" στην Απόφαση.`;

  return {
    title: suggestion.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title: suggestion.title,
      description,
      url: canonicalUrl,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: suggestion.title }],
      publishedTime: suggestion.createdAt,
      modifiedTime: suggestion.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: suggestion.title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function SuggestionDetailPage({ params }) {
  const suggestion = await fetchSuggestion(params.id);
  const canonicalUrl = suggestion ? `${SITE_URL}/suggestions/${suggestion.id}` : null;

  const jsonLd = suggestion
    ? {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: suggestion.title,
        description: suggestion.body || '',
        image: DEFAULT_OG_IMAGE,
        dateCreated: suggestion.createdAt,
        dateModified: suggestion.updatedAt || suggestion.createdAt,
        url: canonicalUrl,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SuggestionDetailClient />
    </>
  );
}
