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

async function fetchOrganization(slug) {
  try {
    const res = await fetch(`${API_URL}/api/organizations/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.organization || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const organization = await fetchOrganization(slug);
  if (!organization) {
    return {
      title: 'Οργάνωση | Απόφαση',
      alternates: { canonical: `${SITE_URL}/organizations/${slug}` },
    };
  }

  const canonicalUrl = `${SITE_URL}/organizations/${organization.slug || slug}`;
  const description = organization.description
    || [organization.type, organization.location?.name].filter(Boolean).join(' · ')
    || `Δείτε την οργάνωση ${organization.name} στην Απόφαση.`;
  const image = absoluteImageUrl(organization.logo);

  return {
    title: organization.name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      title: organization.name,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: organization.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: organization.name,
      description,
      images: [image],
    },
  };
}

export default async function OrganizationLayout({ children, params }) {
  const { slug } = await params;
  const organization = await fetchOrganization(slug);
  const canonicalUrl = organization ? `${SITE_URL}/organizations/${organization.slug || slug}` : null;

  const jsonLd = organization
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organization.name,
        description: organization.description || undefined,
        image: absoluteImageUrl(organization.logo),
        logo: absoluteImageUrl(organization.logo),
        url: canonicalUrl,
        address: organization.location?.name,
        parentOrganization: organization.parent?.name
          ? { '@type': 'Organization', name: organization.parent.name }
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
