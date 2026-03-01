import ArticleDetailClient from './ArticleDetailClient';
import { idSlug } from '@/lib/utils/slugify';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/branding/news default.png`;

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
  const article = await fetchArticle(params.id);
  if (!article) {
    return { title: 'Άρθρο | Απόφαση' };
  }

  const slug = idSlug(article.id, article.title);
  const canonicalUrl = `${SITE_URL}/articles/${slug}`;
  const image = article.bannerImageUrl || DEFAULT_OG_IMAGE;
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
      images: [{ url: image }],
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
        image: article.bannerImageUrl || DEFAULT_OG_IMAGE,
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
