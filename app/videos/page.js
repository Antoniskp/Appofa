'use client';

import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
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
import { useAuth } from '@/lib/auth-context';

export default function VideosPage() {
  const { user } = useAuth();

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
    type: 'video',
    search: '',
  });

  const handleSearchChange = (e) => {
    updateFilter('search', e.target.value);
  };

  const handleCategorySelect = (cat) => {
    updateFilter('category', cat);
  };

  const videoCategoryOptions = (articleCategories.articleTypes?.video?.categories ?? []).map(cat =>
    typeof cat === 'string' ? { value: cat, label: cat } : cat
  );

  const { data: videos, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 12,
        ...filters,
        status: 'published',
      };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
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
        {/* Header with Add Video button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Βίντεο</h1>
          {user && (
            <Link
              href="/videos/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Προσθήκη Βίντεο
            </Link>
          )}
        </div>

        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <SearchInput
            name="search"
            placeholder="Αναζήτηση βίντεο..."
            value={filters.search}
            onChange={handleSearchChange}
            className="max-w-md"
          />
          <CategoryPills
            categories={videoCategoryOptions}
            selected={filters.category}
            onSelect={handleCategorySelect}
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
            title="Σφάλμα Φόρτωσης Βίντεο"
            description={error}
            action={{
              text: 'Δοκιμάστε Ξανά',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <EmptyState
            type="empty"
            title="Δεν Βρέθηκαν Βίντεο"
            description="Δεν υπάρχουν βίντεο που να ταιριάζουν με τα κριτήρια αναζήτησής σας. Δοκιμάστε να αλλάξετε τα φίλτρα."
          />
        )}

        {/* Videos Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <ArticleCard key={video.id} article={video} variant="grid" />
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
