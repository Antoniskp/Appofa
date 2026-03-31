'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon, MapPinIcon, LightBulbIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import Badge from '@/components/Badge';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';

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

function VoteCounts({ upvotes, downvotes }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="text-green-600 font-semibold">👍 {upvotes ?? 0}</span>
      <span className="text-red-500 font-semibold">👎 {downvotes ?? 0}</span>
    </span>
  );
}

function SuggestionCard({ suggestion }) {
  const TypeIcon = TYPE_ICONS[suggestion.type] || LightBulbIcon;

  return (
    <Link
      href={`/suggestions/${suggestion.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
    >
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
            <span className="flex items-center gap-1">
              <VoteCounts upvotes={suggestion.upvotes} downvotes={suggestion.downvotes} />
            </span>
            {suggestion.solutions && (
              <span>{suggestion.solutions?.length ?? 0} λύσεις</span>
            )}
          </div>
        </div>
      </div>
    </Link>
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
  } = useFilters({ type: '', status: '', sort: 'newest' });

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mine ? 'Οι Προτάσεις μου' : 'Προτάσεις & Ιδέες'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mine
                ? 'Οι προτάσεις και ιδέες που έχετε υποβάλει.'
                : 'Μοιραστείτε ιδέες και προβλήματα για να βελτιωθεί η κοινότητά σας.'}
            </p>
          </div>
          {user && (
            <Link
              href="/suggestions/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Νέα Πρόταση
            </Link>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          filterConfig={[
            {
              name: 'type',
              label: 'Τύπος',
              type: 'select',
              options: [
                { value: '', label: 'Όλοι' },
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
                { value: '', label: 'Όλες' },
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

        {/* Content */}
        {loading ? (
          <SkeletonLoader count={6} type="card" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onNext={nextPage}
                onPrev={prevPage}
                onGoTo={goToPage}
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
