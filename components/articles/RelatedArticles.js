'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { articleAPI } from '@/lib/api/articles';
import { fetchRelatedArticles } from '@/lib/utils/relatedArticles';
import ArticleCard from './ArticleCard';

export default function RelatedArticles({ article }) {
  const t = useTranslations('articles');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRelatedArticles(article, articleAPI.getAll).then((articles) => {
      if (active) setResult({ sourceId: article.id, articles });
    });
    return () => { active = false; };
  }, [article]);

  const articles = result?.sourceId === article.id ? result.articles : [];
  if (!articles.length) return null;

  return (
    <section aria-labelledby="related-stories-heading" className="my-10 border-t border-gray-200 pt-8 print:hidden">
      <div className="mb-6">
        <h2 id="related-stories-heading" className="text-2xl font-bold text-gray-900">{t('related_stories')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('related_stories_description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {articles.map((related) => <ArticleCard key={related.id} article={related} />)}
      </div>
    </section>
  );
}
