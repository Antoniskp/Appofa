'use client';

import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import ArticleCard from '@/components/ArticleCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import CategoryPills from '@/components/CategoryPills';

export default function NewsPage() {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    handleFilterChange,
    nextPage,
    prevPage,
    goToPage,
    updateFilter,
  } = useFilters({
    category: '',
    search: '',
  });

  // For search input
  const handleSearchChange = (e) => {
    updateFilter('search', e.target.value);
  };
  // For category pills
  const handleCategorySelect = (cat) => {
    updateFilter('category', cat);
  };

  // Convert categories to array of { value, label }
  const newsCategoryOptions = (articleCategories.articleTypes?.news?.categories ?? []).map(cat =>
    typeof cat === 'string' ? { value: cat, label: cat } : cat
  );

  const { data: articles, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 12,
        status: 'published',
        type: 'news',
        ...filters,
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      // Remove tag param if present
      if (params.tag) delete params.tag;
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
        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <SearchInput
            name="search"
            placeholder="Search news..."
            value={filters.search}
            onChange={handleSearchChange}
            className="max-w-md"
          />
          <CategoryPills
            categories={newsCategoryOptions}
            selected={filters.category}
            onSelect={handleCategorySelect}
          />
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
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

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <EmptyState
            type="empty"
            title="No News Available"
            description="There are no approved news stories yet. Check back soon!"
          />
        )}

        {/* News Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="grid" />
            ))}
          </div>
        )}

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
