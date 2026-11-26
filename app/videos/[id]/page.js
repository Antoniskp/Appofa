import { metaDescription } from '@/lib/utils/editorialPreview';
import ArticleDetailClient from '@/app/articles/[id]/ArticleDetailClient';
import { getTranslations } from 'next-intl/server';
import { SITE_URL, DEFAULT_OG_IMAGE, serializeJsonLd } from '@/lib/seo';
import { idSlug } from '@/lib/utils/slugify';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function absoluteImageUrl(url) {
  if (!url) return DEFAULT_OG_IMAGE;
  try {
    return new URL(url, SITE_URL).toString();
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

async function fetchArticle(id) {
  try {
    const numericId = parseInt(id, 10);
    if (!numericId) return null;
    const res = await fetch(`${API_URL}/api/articles/${numericId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.article || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await fetchArticle(id);
  if (!article) {
    const t = await getTranslations('videos');
    return { title: t('title'), alternates: null, openGraph: null, twitter: null };
  }

  const slug = idSlug(article.id, article.title);
  const canonicalUrl = `${SITE_URL}/videos/${slug}`;
  const image = absoluteImageUrl(article.sourceMeta?.thumbnailUrl || article.bannerImageUrl);
  const description = metaDescription(article);

  return {
    title: article.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'video.other',
      title: article.title,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.publishedAt || article.createdAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default async function VideoDetailPage({ params }) {
  const { id } = await params;
  const article = await fetchArticle(id);

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: article.title,
        description: metaDescription(article),
        thumbnailUrl: absoluteImageUrl(article.sourceMeta?.thumbnailUrl || article.bannerImageUrl),
        uploadDate: article.publishedAt || article.createdAt,
        url: `${SITE_URL}/videos/${idSlug(article.id, article.title)}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <ArticleDetailClient />
    </>
  );
}
