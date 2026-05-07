'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import SearchInput from '@/components/ui/SearchInput';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import CivicQuestionCard from '@/components/civicQuestions/CivicQuestionCard';

export default function CivicQuestionsPage() {
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
  } = useFilters({ status: '', sourceType: '', search: '' });

  const [filterBarOpen, setFilterBarOpen] = useState(false);

  const { data: civicQuestions, loading, error } = useAsyncData(
    async () => {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const response = await civicQuestionAPI.getAll(params);
      if (response.success) return response;
      return { data: [], pagination: { totalPages: 1 } };
    },
    [page, filters],
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <SearchInput
            name="search"
            placeholder="Search civic questions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full sm:flex-grow sm:max-w-md"
          />
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            isOpen={filterBarOpen}
            onToggle={() => setFilterBarOpen((prev) => !prev)}
            filterConfig={[
              {
                name: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { value: '', label: 'All statuses' },
                  { value: 'open', label: 'Open' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'archived', label: 'Archived' },
                ],
              },
              {
                name: 'sourceType',
                label: 'Source',
                type: 'select',
                options: [
                  { value: '', label: 'All sources' },
                  { value: 'parliament', label: 'Parliament' },
                  { value: 'european_commission', label: 'European Commission' },
                  { value: 'municipal_council', label: 'Municipal Council' },
                  { value: 'regional_council', label: 'Regional Council' },
                  { value: 'other', label: 'Other' },
                ],
              },
            ]}
          />
          {user && (
            <Link
              href="/civic-questions/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircleIcon className="h-5 w-5" />
              New Civic Question
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title="Failed to load civic questions"
            description={error}
          />
        )}

        {!loading && !error && civicQuestions.length === 0 && (
          <EmptyState
            type="empty"
            title="No civic questions found"
            description="Create the first civic question for your community."
            action={user ? { label: 'Create Civic Question', href: '/civic-questions/create' } : undefined}
          />
        )}

        {!loading && !error && civicQuestions.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {civicQuestions.map((civicQuestion) => (
                <CivicQuestionCard key={civicQuestion.id} civicQuestion={civicQuestion} />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPrevious={prevPage}
              onNext={nextPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
