'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { suggestionAPI, tagAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import FilterBar from '@/components/ui/FilterBar';
import SearchInput from '@/components/ui/SearchInput';
import CategoryPills from '@/components/ui/CategoryPills';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import articleCategories from '@/config/articleCategories.json';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import SuggestionCard from '@/components/SuggestionCard';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';

const suggestionCategoryOptions = (articleCategories.suggestionCategories || []).map((cat) => ({
  value: cat,
  label: cat,
}));

function SuggestionsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mine = searchParams.get('mine') === 'true';
  const initialTag = searchParams.get('tag') || '';
  const {
    filters,
    handleFilterChange,
    updateFilter,
  } = useFilters({ type: '', status: '', sort: 'newest', category: '', tag: initialTag, search: '', locationId: null });

  const [categoryCounts, setCategoryCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [filterBarOpen, setFilterBarOpen] = useState(false);
  const [topTags, setTopTags] = useState([]);

  useEffect(() => {
    suggestionAPI.getCategoryCounts()
      .then((res) => { if (res?.success) setCategoryCounts(res.data.counts); })
      .catch((err) => console.error('Failed to fetch suggestion category counts:', err))
      .finally(() => setCountsLoaded(true));
    tagAPI.getSuggestions({ entityType: 'suggestion' })
      .then((res) => {
        const tags = Array.isArray(res?.tags) ? res.tags : [];
        setTopTags(tags.slice(0, 5).map((t) => t?.name || t).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  const { items: suggestions, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (p, lim) => {
      const params = { page: p, limit: lim, ...filters };
      if (mine && user?.id) params.authorId = user.id;
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const response = await suggestionAPI.getAll(params);
      const items = response?.data || [];
      const pagination = response?.pagination || {};
      return {
        items,
        hasMore: (pagination.currentPage ?? p) < (pagination.totalPages ?? 1),
      };
    },
    12,
    [filters, mine, user?.id]
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Location Breadcrumb */}
        <LocationFilterBreadcrumb
          value={filters.locationId}
          onChange={(locationId) => updateFilter('locationId', locationId)}
        />

        {/* Search, Filters, and action button */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              name="search"
              placeholder="Αναζήτηση προτάσεων..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full sm:flex-grow sm:max-w-md min-w-0"
            />
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              isOpen={filterBarOpen}
              onToggle={() => setFilterBarOpen((prev) => !prev)}
              filterConfig={[
                {
                  name: 'type',
                  label: 'Τύπος',
                  type: 'select',
                  options: [
                    { value: '', label: 'Όλοι οι τύποι' },
                    { value: 'idea', label: 'Ιδέα' },
                    { value: 'problem', label: 'Πρόβλημα' },
                    { value: 'problem_request', label: 'Ερώτημα Κοινότητας' },
                    { value: 'location_suggestion', label: 'Τοποθεσία' },
                  ],
                },
                {
                  name: 'status',
                  label: 'Κατάσταση',
                  type: 'select',
                  options: [
                    { value: '', label: 'Όλες οι καταστάσεις' },
                    { value: 'open', label: 'Ανοιχτό' },
                    { value: 'under_review', label: 'Σε Εξέταση' },
                    { value: 'implemented', label: 'Υλοποιήθηκε' },
                    { value: 'rejected', label: 'Απορρίφθηκε' },
                  ],
                },
                {
                  name: 'sort',
                  label: 'Ταξινόμηση',
                  type: 'select',
                  options: [
                    { value: 'newest', label: 'Νεότερα' },
                    { value: 'top', label: 'Κορυφαία' },
                  ],
                },
              ]}
            />
            {user && (
              <Link
                href="/suggestions/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Νέα Πρόταση
              </Link>
            )}
          </div>
          <CategoryPills
            categories={suggestionCategoryOptions}
            selected={filters.category}
            onSelect={(cat) => updateFilter('category', cat)}
            counts={categoryCounts}
            countsLoaded={countsLoaded}
            topTags={topTags}
            selectedTag={filters.tag}
            onTagSelect={(tag) => updateFilter('tag', tag)}
          />
        </div>

        {/* Content */}
        {initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <SkeletonLoader count={6} type="card" />
          </div>
        ) : error ? (
          <EmptyState
            title="Σφάλμα φόρτωσης"
            description={error}
            icon="error"
          />
        ) : suggestions.length === 0 ? (
          <EmptyState
            title="Δεν βρέθηκαν προτάσεις"
            description="Γίνετε ο πρώτος που θα μοιραστεί μια ιδέα!"
            action={user ? { label: 'Νέα Πρόταση', href: '/suggestions/new' } : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
            <LoadMoreTrigger
              hasMore={hasMore}
              loading={loading}
              onLoadMore={loadMore}
              skeletonType="card"
              skeletonCount={3}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function SuggestionsPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SuggestionsContent />
    </Suspense>
  );
}
