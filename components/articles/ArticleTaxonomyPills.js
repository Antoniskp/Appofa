'use client';

import Link from 'next/link';
import Badge, { TypeBadge } from '@/components/ui/Badge';
import {
  buildTaxonomyHref,
  getArticleListPath,
  getArticleTypeHref,
} from '@/lib/utils/taxonomyLinks';

const focusClassName = 'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export default function ArticleTaxonomyPills({ article, size = 'md' }) {
  if (!article) return null;

  const listPath = getArticleListPath(article.type);
  const tags = Array.isArray(article.tags) ? article.tags.filter(Boolean) : [];

  return (
    <>
      {article.type && (
        <Link href={getArticleTypeHref(article.type)} className={focusClassName}>
          <TypeBadge type={article.type} size={size} className="cursor-pointer hover:opacity-90 transition-opacity" />
        </Link>
      )}
      {article.category && (
        <Link href={buildTaxonomyHref(listPath, 'category', article.category)} className={focusClassName}>
          <Badge variant="primary" size={size} className="cursor-pointer hover:opacity-90 transition-opacity">
            {article.category}
          </Badge>
        </Link>
      )}
      {tags.map((tag) => (
        <Link key={tag} href={buildTaxonomyHref(listPath, 'tag', tag)} className={focusClassName}>
          <Badge variant="purple" size={size} className="cursor-pointer hover:opacity-90 transition-opacity">
            {tag}
          </Badge>
        </Link>
      ))}
    </>
  );
}
