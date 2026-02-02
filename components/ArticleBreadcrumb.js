'use client';

import Link from 'next/link';
import { getArticleTypeLabel } from '@/lib/utils/articleTypes';

const ARTICLE_TYPE_CONFIG = {
  news: {
    href: '/news',
    labelKey: 'news',
  },
  articles: {
    href: '/articles',
    labelKey: 'articles',
  },
  personal: {
    href: '/articles',
    labelKey: 'personal',
  },
};

const resolveArticleType = (article) => {
  if (typeof article?.type === 'string' && article.type.trim() !== '') {
    return ARTICLE_TYPE_CONFIG[article.type] ? article.type : 'articles';
  }
  if (article?.isNews) {
    return 'news';
  }
  return undefined;
};

export default function ArticleBreadcrumb({ article, className = '' }) {
  const inferredType = resolveArticleType(article);
  const fallbackType = inferredType ?? (article ? 'articles' : undefined);
  if (!fallbackType) {
    return null;
  }
  const breadcrumb = ARTICLE_TYPE_CONFIG[fallbackType];
  const breadcrumbLabel = getArticleTypeLabel(breadcrumb.labelKey) || breadcrumb.labelKey;
  const categoryLabel = article?.category;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <li>
          <Link href={breadcrumb.href} className="text-blue-600 hover:text-blue-800">
            {breadcrumbLabel}
          </Link>
        </li>
        {categoryLabel && (
          <>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">{categoryLabel}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
