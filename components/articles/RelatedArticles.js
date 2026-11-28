'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { articleAPI } from '@/lib/api/articles';
import { fetchRelatedArticles } from '@/lib/utils/relatedArticles';
import ArticleCard from './ArticleCard';

/**
 * Related articles block. `source` may be an article or a poll; set
 * `excludeSelf` to false when the source is not an article.
 */
export default function RelatedArticles({ source, limit = 4, excludeSelf = true }) {
  const t = useTranslations('articles');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRelatedArticles(source, articleAPI.getAll, { limit, excludeId: excludeSelf ? source.id : null })
      .then((articles) => {
        if (active) setResult({ source, articles });
      });
    return () => { active = false; };
  }, [source, limit, excludeSelf]);

  const articles = result?.source === source ? result.articles : [];
  if (!articles.length) return null;

  return (
    <section aria-labelledby="related-stories-heading" className="my-10 border-t border-gray-200 pt-8 print:hidden">
      <div className="mb-6">
        <h2 id="related-stories-heading" className="text-2xl font-bold text-gray-900">{t('related_stories')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('related_stories_description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {articles.map((related) => <ArticleCard key={related.id} article={related} imageSizes="(max-width: 639px) 100vw, 50vw" />)}
      </div>
    </section>
  );
}
