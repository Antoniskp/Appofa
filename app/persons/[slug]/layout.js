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

function personName(profile) {
  return [
    profile?.firstNameNative || profile?.firstNameEn,
    profile?.lastNameNative || profile?.lastNameEn,
  ].filter(Boolean).join(' ') || profile?.username || 'Πρόσωπο';
}

async function fetchPerson(slug) {
  try {
    const res = await fetch(`${API_URL}/api/persons/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.profile || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profile = await fetchPerson(slug);
  if (!profile) {
    return {
      title: 'Πρόσωπο | Απόφαση',
      alternates: { canonical: `${SITE_URL}/persons/${slug}` },
    };
  }

  const title = personName(profile);
  const canonicalUrl = `${SITE_URL}/persons/${profile.slug || slug}`;
  const description = profile.bio
    || [profile.location?.name, profile.constituency?.name].filter(Boolean).join(' · ')
    || `Δείτε το δημόσιο προφίλ ${title} στην Απόφαση.`;
  const image = absoluteImageUrl(profile.photo || profile.avatar || profile.avatarUrl);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PersonLayout({ children, params }) {
  const { slug } = await params;
  const profile = await fetchPerson(slug);
  const title = profile ? personName(profile) : null;
  const canonicalUrl = profile ? `${SITE_URL}/persons/${profile.slug || slug}` : null;

  const jsonLd = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: title,
        description: profile.bio || undefined,
        image: absoluteImageUrl(profile.photo || profile.avatar || profile.avatarUrl),
        url: canonicalUrl,
        homeLocation: profile.location?.name
          ? { '@type': 'Place', name: profile.location.name }
          : undefined,
        affiliation: Array.isArray(profile.politicalAffiliations)
          ? profile.politicalAffiliations
              .map((affiliation) => affiliation.organization?.name)
              .filter(Boolean)
              .map((name) => ({ '@type': 'Organization', name }))
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
