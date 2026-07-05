import ArticleDetailClient from './ArticleDetailClient';
import { idSlug } from '@/lib/utils/slugify';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
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
  const tArticles = await getTranslations('articles');
  const tCommon = await getTranslations('common');
  const article = await fetchArticle(params.id);
  if (!article) {
    return { title: `${tArticles('single_title')} | ${tCommon('app_name')}` };
  }

  const slug = idSlug(article.id, article.title);
  const canonicalUrl = `${SITE_URL}/articles/${slug}`;
  const image = absoluteImageUrl(article.bannerImageUrl);
  const description = article.summary || article.content?.substring(0, 160) || '';

  return {
    title: article.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
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

export default async function ArticleDetailPage({ params }) {
  const article = await fetchArticle(params.id);

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.summary || article.content?.substring(0, 160) || '',
        image: absoluteImageUrl(article.bannerImageUrl),
        datePublished: article.publishedAt || article.createdAt,
        dateModified: article.updatedAt || article.createdAt,
        author: !article.hideAuthor && article.author?.username
          ? { '@type': 'Person', name: article.author.username }
          : undefined,
        url: `${SITE_URL}/articles/${idSlug(article.id, article.title)}`,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/articles/${idSlug(article.id, article.title)}`,
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
      <ArticleDetailClient />
    </>
  );
}
