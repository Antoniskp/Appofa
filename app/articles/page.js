'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { articleAPI, tagAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import ArticleCard from '@/components/articles/ArticleCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import CategoryPills from '@/components/ui/CategoryPills';
import { useAuth } from '@/lib/auth-context';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';

function ArticlesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') || '';
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

  const { data: articles, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 12,
        ...filters,
        status: 'published',
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
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
              placeholder="Search articles..."
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
                Νέο Άρθρο
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
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <EmptyState
            type="error"
            title="Error Loading Articles"
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
            title="No Articles Found"
            description="No articles match your current filters. Try adjusting your search criteria."
          />
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="grid" />
            ))}
          </div>
        )}

        {/* Pagination */}
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

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
