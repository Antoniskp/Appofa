export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Attempt to fetch formation metadata for OG tags.
  // Falls back to generic metadata if fetch fails or backend is unavailable.
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://appofa.gr';
    const apiUrl = process.env.API_URL || baseUrl;
    const res = await fetch(`${apiUrl}/api/dream-team/formations/share/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const formation = data?.data;
      if (formation) {
        const title = `${formation.name} — Ιδανική Κυβέρνηση`;
        const description = formation.description
          || `Δείτε την ιδανική κυβέρνηση του ${formation.authorName || 'χρήστη'} στο Appofa.`;
        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `${baseUrl}/dream-team/f/${slug}`,
            type: 'website',
          },
          twitter: {
            card: 'summary',
            title,
            description,
          },
        };
      }
    }
  } catch {
    // Backend not available — fall through to generic metadata
  }

  return {
    title: 'Ιδανική Κυβέρνηση — Appofa',
    description: 'Δείτε μια ιδανική κυβέρνηση στο Appofa.',
  };
}

export default function SharedFormationLayout({ children }) {
  return children;
}
