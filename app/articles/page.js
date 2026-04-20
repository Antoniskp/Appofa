'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { articleAPI, tagAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import ArticleCard from '@/components/articles/ArticleCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import SearchInput from '@/components/ui/SearchInput';
import CategoryPills from '@/components/ui/CategoryPills';
import { useAuth } from '@/lib/auth-context';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';

function ArticlesContent() {
  const tArticles = useTranslations('articles');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') || '';
  const {
    filters,
    updateFilter,
  } = useFilters({
    category: '',
    type: 'articles',
    tag: initialTag,
    search: '',
    locationId: null,
  });

  const [categoryCounts, setCategoryCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [topTags, setTopTags] = useState([]);

  useEffect(() => {
    articleAPI.getCategoryCounts({ type: 'articles', status: 'published' })
      .then((res) => { if (res?.success) setCategoryCounts(res.data.counts); })
      .catch((err) => console.error('Failed to fetch article category counts:', err))
      .finally(() => setCountsLoaded(true));
    tagAPI.getSuggestions({ entityType: 'article' })
      .then((res) => {
        const tags = Array.isArray(res?.tags) ? res.tags : [];
        setTopTags(tags.slice(0, 5).map((t) => t?.name || t).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  // For search input
  const handleSearchChange = (e) => {
    updateFilter('search', e.target.value);
  };
  // For category pills
  const handleCategorySelect = (cat) => {
    // Use updateFilter to set category directly
    updateFilter('category', cat);
  };

  // Convert categories to array of { value, label }
  const articleCategoryOptions = (articleCategories.articleTypes?.articles?.categories ?? []).map(cat =>
    typeof cat === 'string' ? { value: cat, label: cat } : cat
  );

  const { items: articles, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (p, lim) => {
      const params = {
        page: p,
        limit: lim,
        ...filters,
        status: 'published',
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      const response = await articleAPI.getAll(params);
      const items = response?.data?.articles || [];
      const pagination = response?.data?.pagination || {};
      return {
        items,
        hasMore: (pagination.currentPage ?? p) < (pagination.totalPages ?? 1),
      };
    },
    12,
    [filters]
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Location Breadcrumb */}
        <LocationFilterBreadcrumb
          value={filters.locationId}
          onChange={(locationId) => updateFilter('locationId', locationId)}
        />

        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              name="search"
               placeholder={tArticles('search_placeholder')}
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full sm:flex-grow sm:max-w-md min-w-0"
            />
            {user && (
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5" />
                 {tArticles('create_new')}
              </Link>
            )}
          </div>
          <CategoryPills
            categories={articleCategoryOptions}
            selected={filters.category}
            onSelect={handleCategorySelect}
            counts={categoryCounts}
            countsLoaded={countsLoaded}
            topTags={topTags}
            selectedTag={filters.tag}
            onTagSelect={(tag) => updateFilter('tag', tag)}
          />
        </div>

        {/* Loading State */}
        {initialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <EmptyState
            type="error"
             title={tArticles('error_loading')}
            description={error}
            action={{
               text: tCommon('try_again'),
              onClick: () => window.location.reload()
            }}
          />
        )}

        {/* Empty State */}
        {!initialLoading && !error && articles.length === 0 && (
          <EmptyState
            type="empty"
             title={tArticles('no_articles_found')}
             description={tArticles('no_articles_description')}
          />
        )}

        {/* Articles Grid */}
        {!error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="grid" />
            ))}
          </div>
        )}

        {!initialLoading && !error && articles.length > 0 && (
          <LoadMoreTrigger
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            skeletonType="card"
            skeletonCount={3}
          />
        )}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const tCommon = useTranslations('common');
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8 flex items-center justify-center">
         <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
