'use client';

import Link from 'next/link';
import { getArticleTypeLabel } from '@/lib/utils/articleTypes';

export default function ArticleBreadcrumb({ article, className = '' }) {
  const articleType = article?.type || (article?.isNews ? 'news' : 'articles');
  const articleTypeConfig = {
    news: {
      href: '/news',
      label: getArticleTypeLabel('news'),
    },
    articles: {
      href: '/articles',
      label: getArticleTypeLabel('articles'),
    },
    personal: {
      href: '/articles',
      label: getArticleTypeLabel('personal'),
    },
  };
  const breadcrumb = articleTypeConfig[articleType] ?? articleTypeConfig.articles;
  const categoryLabel = article?.category;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <li>
          <Link href={breadcrumb.href} className="text-blue-600 hover:text-blue-800">
            {breadcrumb.label}
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
