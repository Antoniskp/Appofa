'use client';

import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';

export default function NewsPage() {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    handleFilterChange,
    resetFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useFilters({
    category: '',
    tag: '',
  });

  const newsCategoryOptions = articleCategories.articleTypes?.news?.categories ?? [];

  const { data: articles, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 10,
        status: 'published',
        type: 'news',
      };

      if (filters.tag) {
        params.tag = filters.tag;
      }
      if (filters.category) {
        params.category = filters.category;
      }

      const response = await articleAPI.getAll(params);
      if (response.success) {
        return response;
      }
      return { data: { articles: [], pagination: { totalPages: 1 } } };
    },
    [page, filters],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.data.pagination?.totalPages || 1);
        return response.data.articles || [];
      }
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          filterConfig={[
            {
              name: 'category',
              label: 'Category',
              type: 'select',
              options: newsCategoryOptions,
              placeholder: 'All categories',
            },
            {
              name: 'tag',
              label: 'Tag',
              type: 'text',
              placeholder: 'Filter by tag...',
            },
          ]}
          className="mt-4 mb-8"
        />

        {loading && (
          <div className="space-y-6">
            <SkeletonLoader type="card" count={5} variant="list" />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title="Error Loading News"
            description={error}
            action={{
              text: 'Try Again',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {!loading && !error && articles.length === 0 && (
          <EmptyState
            type="empty"
            title="No News Available"
            description="There are no approved news stories yet. Check back soon!"
          />
        )}

        <div className="space-y-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="list" />
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          onPrevious={prevPage}
          onNext={nextPage}
        />
      </div>
    </div>
  );
}
