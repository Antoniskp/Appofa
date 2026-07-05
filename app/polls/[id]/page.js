import PollDetailClient from './PollDetailClient';
import { idSlug } from '@/lib/utils/slugify';

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

function firstOptionImage(poll) {
  if (!Array.isArray(poll?.options)) return null;
  return poll.options.find((option) => option?.photoUrl)?.photoUrl || null;
}

function absoluteImageUrl(url) {
  if (!url) return DEFAULT_OG_IMAGE;
  try {
    return new URL(url, SITE_URL).toString();
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

async function fetchPoll(id) {
  try {
    const numericId = parseInt(id, 10);
    if (!numericId) return null;

    const res = await fetch(`${API_URL}/api/polls/${numericId}`, {
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
  const poll = await fetchPoll(params.id);
  if (!poll) {
    return {
      title: 'Δημοσκόπηση | Απόφαση',
      alternates: { canonical: `${SITE_URL}/polls/${params.id}` },
    };
  }

  const slug = idSlug(poll.id, poll.title);
  const canonicalUrl = `${SITE_URL}/polls/${slug}`;
  const description = poll.description || `Ψηφίστε στη δημοσκόπηση "${poll.title}" στην Απόφαση.`;
  const image = absoluteImageUrl(firstOptionImage(poll));

  return {
    title: poll.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title: poll.title,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: poll.title }],
      publishedTime: poll.createdAt,
      modifiedTime: poll.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: poll.title,
      description,
      images: [image],
    },
  };
}

export default async function PollDetailPage({ params }) {
  const poll = await fetchPoll(params.id);
  const canonicalUrl = poll ? `${SITE_URL}/polls/${idSlug(poll.id, poll.title)}` : null;

  const jsonLd = poll
    ? {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: poll.title,
        description: poll.description || '',
        image: absoluteImageUrl(firstOptionImage(poll)),
        dateCreated: poll.createdAt,
        dateModified: poll.updatedAt || poll.createdAt,
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
      <PollDetailClient />
    </>
  );
}
