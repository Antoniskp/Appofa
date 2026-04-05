'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon, MapPinIcon, LightBulbIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import Badge from '@/components/ui/Badge';
import InlineSuggestionVote from '@/components/InlineSuggestionVote';
import SearchInput from '@/components/ui/SearchInput';
import CategoryPills from '@/components/ui/CategoryPills';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import articleCategories from '@/config/articleCategories.json';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';

const TYPE_LABELS = {
  idea: 'Ιδέα',
  problem: 'Πρόβλημα',
  problem_request: 'Ερώτημα Κοινότητας',
  location_suggestion: 'Τοποθεσία',
};

const TYPE_ICONS = {
  idea: LightBulbIcon,
  problem: ExclamationTriangleIcon,
  problem_request: QuestionMarkCircleIcon,
  location_suggestion: MapPinIcon,
};

const TYPE_VARIANTS = {
  idea: 'primary',
  problem: 'warning',
  problem_request: 'danger',
  location_suggestion: 'success',
};

const STATUS_LABELS = {
  open: 'Ανοιχτό',
  under_review: 'Σε Εξέταση',
  implemented: 'Υλοποιήθηκε',
  rejected: 'Απορρίφθηκε',
};

const STATUS_VARIANTS = {
  open: 'info',
  under_review: 'warning',
  implemented: 'success',
  rejected: 'danger',
};

const suggestionCategoryOptions = (articleCategories.suggestionCategories || []).map((cat) => ({
  value: cat,
  label: cat,
}));

function SuggestionCard({ suggestion }) {
  const TypeIcon = TYPE_ICONS[suggestion.type] || LightBulbIcon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <Link href={`/suggestions/${suggestion.id}`} className="block">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <TypeIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={TYPE_VARIANTS[suggestion.type] || 'default'}>
                {TYPE_LABELS[suggestion.type] || suggestion.type}
              </Badge>
              <Badge variant={STATUS_VARIANTS[suggestion.status] || 'default'}>
                {STATUS_LABELS[suggestion.status] || suggestion.status}
              </Badge>
              {suggestion.category && (
                <Badge variant="default">
                  {suggestion.category}
                </Badge>
              )}
              {suggestion.location && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {suggestion.location.name}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate">{suggestion.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{suggestion.body}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              {suggestion.author && (
                <span>@{suggestion.author.username}</span>
              )}
              <span>{new Date(suggestion.createdAt).toLocaleDateString('el-GR')}</span>
              {suggestion.solutions && (
                <span>{suggestion.solutions?.length ?? 0} λύσεις</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-3 flex justify-end">
        <InlineSuggestionVote
          suggestionId={suggestion.id}
          type={suggestion.type}
          initialUpvotes={suggestion.upvotes ?? 0}
          initialDownvotes={suggestion.downvotes ?? 0}
          initialMyVote={suggestion.myVote ?? null}
        />
      </div>
    </div>
  );
}

function SuggestionsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mine = searchParams.get('mine') === 'true';
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
  } = useFilters({ type: '', status: '', sort: 'newest', category: '', search: '', locationId: null });

  const [categoryCounts, setCategoryCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [filterBarOpen, setFilterBarOpen] = useState(false);

  useEffect(() => {
    suggestionAPI.getCategoryCounts()
      .then((res) => { if (res?.success) setCategoryCounts(res.data.counts); })
      .catch((err) => console.error('Failed to fetch suggestion category counts:', err))
      .finally(() => setCountsLoaded(true));
  }, []);

  const { data: suggestions, loading, error } = useAsyncData(
    async () => {
      const params = { page, limit: 12, ...filters };
      if (mine && user?.id) params.authorId = user.id;
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const response = await suggestionAPI.getAll(params);
      if (response.success) return response;
      return { data: [], pagination: { totalPages: 1 } };
    },
    [page, filters, mine, user?.id],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.pagination?.totalPages || 1);
        return response.data || [];
      },
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
          />
        </div>

        {/* Content */}
        {loading ? (
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
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onNext={nextPage}
                onPrevious={prevPage}
                onPageChange={goToPage}
              />
            </div>
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
