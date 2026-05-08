import CivicQuestionDetailClient from './CivicQuestionDetailClient';

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/appofa-app-icon.png`;

async function fetchCivicQuestion(id) {
  try {
    const numericId = parseInt(id, 10);
    if (!numericId) return null;

    const response = await fetch(`${API_URL}/api/civic-questions/${numericId}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const civicQuestion = await fetchCivicQuestion(params.id);
  if (!civicQuestion) {
    return {
      title: 'Civic Question | Απόφαση',
      alternates: { canonical: `${SITE_URL}/civic-questions/${params.id}` },
    };
  }

  const title = civicQuestion.title;
  const description = civicQuestion.simplified || civicQuestion.pros || civicQuestion.cons || '';
  const canonicalUrl = `${SITE_URL}/civic-questions/${civicQuestion.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default function CivicQuestionDetailPage() {
  return <CivicQuestionDetailClient />;
}
