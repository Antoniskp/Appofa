const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

function absoluteImageUrl(url) {
  if (!url) return DEFAULT_OG_IMAGE;
  try {
    return new URL(url, SITE_URL).toString();
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

async function fetchLocation(slug) {
  try {
    const res = await fetch(`${API_URL}/api/locations/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.location || null;
  } catch {
    return null;
  }
}

function locationTitle(location, fallbackSlug) {
  if (location?.name_local && location?.name && location.name_local !== location.name) {
    return `${location.name_local} (${location.name})`;
  }
  return location?.name_local || location?.name || fallbackSlug;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const location = await fetchLocation(slug);
  const name = locationTitle(location, slug);
  const canonicalSlug = location?.slug || slug;
  const canonicalUrl = `${SITE_URL}/locations/${canonicalSlug}`;
  const description = location
    ? `Τοπικές ειδήσεις, δημοσκοπήσεις, προτάσεις και συμμετοχή για ${name} στην Απόφαση.`
    : `News, education, polls, and community information for ${name} on Appofa.`;
  const image = absoluteImageUrl(location?.image_url || location?.imageUrl);

  return {
    title: `${name} - Απόφαση`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} - Απόφαση`,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - Απόφαση`,
      description,
      images: [image],
    },
  };
}

export default async function LocationLayout({ children, params }) {
  const { slug } = await params;
  const location = await fetchLocation(slug);
  const name = locationTitle(location, slug);
  const canonicalUrl = location ? `${SITE_URL}/locations/${location.slug || slug}` : null;

  const jsonLd = location
    ? {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name,
        image: absoluteImageUrl(location.image_url || location.imageUrl),
        url: canonicalUrl,
        geo: location.lat && location.lng
          ? {
              '@type': 'GeoCoordinates',
              latitude: location.lat,
              longitude: location.lng,
            }
          : undefined,
        containedInPlace: location.parent?.name
          ? { '@type': 'Place', name: location.parent.name }
          : undefined,
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
      {children}
    </>
  );
}
