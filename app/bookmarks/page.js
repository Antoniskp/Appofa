'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { bookmarkAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ArticleCard from '@/components/ArticleCard';
import PollCard from '@/components/PollCard';

export default function BookmarksPage() {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    handleFilterChange,
    nextPage,
    prevPage,
    goToPage,
  } = useFilters({
    type: '',
  });

  const { data: items, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 12,
      };

      if (filters.type) {
        params.entity_type = filters.type;
      }

      const response = await bookmarkAPI.getAll(params);
      if (response.success) {
        return response;
      }
      return { data: { items: [], pagination: { totalPages: 1 } } };
    },
    [page, filters],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.data.pagination?.totalPages || 1);
        return response.data.items || [];
      }
    }
  );

  const articleItems = items
    .filter((item) => item.entityType === 'article')
    .map((item) => item.entity);
  const pollItems = items
    .filter((item) => item.entityType === 'poll')
    .map((item) => item.entity);

  const hasItems = items.length > 0;

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Αποθηκευμένα</h1>
            <p className="text-gray-600 mt-2">Τα αποθηκευμένα άρθρα και δημοσκοπήσεις σας.</p>
          </div>

          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            filterConfig={[
              {
                name: 'type',
                label: 'Τύπος',
                type: 'select',
                options: [
                  { value: '', label: 'Όλα' },
                  { value: 'article', label: 'Άρθρα' },
                  { value: 'poll', label: 'Δημοσκοπήσεις' },
                ],
              },
            ]}
            className="mb-8"
          />

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={6} />
            </div>
          )}

          {error && (
            <EmptyState
              type="error"
              title="Σφάλμα φόρτωσης"
              description={error}
              action={{
                text: 'Δοκιμάστε ξανά',
                onClick: () => window.location.reload(),
              }}
            />
          )}

          {!loading && !error && !hasItems && (
            <EmptyState
              type="empty"
              title="Δεν υπάρχουν αποθηκευμένα"
              description="Αποθηκεύστε άρθρα και δημοσκοπήσεις για να τα δείτε εδώ."
              action={{
                text: 'Δείτε άρθρα',
                href: '/articles'
              }}
            />
          )}

          {!loading && !error && hasItems && filters.type === 'article' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articleItems.map((article) => (
                <ArticleCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          )}

          {!loading && !error && hasItems && filters.type === 'poll' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pollItems.map((poll) => (
                <PollCard key={poll.id} poll={poll} variant="grid" />
              ))}
            </div>
          )}

          {!loading && !error && hasItems && !filters.type && (
            <div className="space-y-10">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Άρθρα</h2>
                  <span className="text-sm text-gray-500">{articleItems.length}</span>
                </div>
                {articleItems.length === 0 ? (
                  <p className="text-sm text-gray-600">Δεν υπάρχουν αποθηκευμένα άρθρα.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articleItems.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="grid" />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Δημοσκοπήσεις</h2>
                  <span className="text-sm text-gray-500">{pollItems.length}</span>
                </div>
                {pollItems.length === 0 ? (
                  <p className="text-sm text-gray-600">Δεν υπάρχουν αποθηκευμένες δημοσκοπήσεις.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pollItems.map((poll) => (
                      <PollCard key={poll.id} poll={poll} variant="grid" />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {!loading && !error && hasItems && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPrevious={prevPage}
              onNext={nextPage}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
