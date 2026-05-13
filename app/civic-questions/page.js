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
import ListPageToolbar from '@/components/ui/ListPageToolbar';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import CivicQuestionCard from '@/components/civicQuestions/CivicQuestionCard';
import { useTranslations } from 'next-intl';

export default function CivicQuestionsPage() {
  const t = useTranslations('civicQuestions');
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
  } = useFilters({ status: '', sourceType: '', category: '', location: '', sortBy: 'newest', search: '' });

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
        <ListPageToolbar
          searchSlot={
            <SearchInput
              name="search"
              placeholder={t('list.search_placeholder')}
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full"
            />
          }
          filtersSlot={
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              isOpen={filterBarOpen}
              onToggle={() => setFilterBarOpen((prev) => !prev)}
              filterConfig={[
                {
                  name: 'status',
                  label: t('form.status'),
                  type: 'select',
                  options: [
                    { value: '', label: t('list.all_statuses') },
                    { value: 'open', label: t('status.open') },
                    { value: 'closed', label: t('status.closed') },
                    { value: 'archived', label: t('status.archived') },
                  ],
                },
                {
                  name: 'sourceType',
                  label: t('list.source'),
                  type: 'select',
                  options: [
                    { value: '', label: t('list.all_sources') },
                    { value: 'parliament', label: t('source_types.parliament') },
                    { value: 'european_commission', label: t('source_types.european_commission') },
                    { value: 'municipal_council', label: t('source_types.municipal_council') },
                    { value: 'regional_council', label: t('source_types.regional_council') },
                    { value: 'other', label: t('source_types.other') },
                  ],
                },
                {
                  name: 'category',
                  label: t('form.category'),
                  type: 'text',
                  placeholder: t('list.category_placeholder'),
                },
                {
                  name: 'location',
                  label: t('form.location'),
                  type: 'text',
                  placeholder: t('list.location_placeholder'),
                },
                {
                  name: 'sortBy',
                  label: t('list.sort'),
                  type: 'select',
                  options: [
                    { value: 'newest', label: t('list.sort_newest') },
                    { value: 'closing_soon', label: t('list.sort_closing_soon') },
                    { value: 'most_voted', label: t('list.sort_most_voted') },
                  ],
                },
              ]}
            />
          }
          actionsSlot={
            user && (
              <Link
                href="/civic-questions/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5" />
                {t('list.new_civic_question')}
              </Link>
            )
          }
        />

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {error && (
          <EmptyState
            type="error"
            title={t('list.error_title')}
            description={error}
          />
        )}

        {!loading && !error && civicQuestions.length === 0 && (
          <EmptyState
            type="empty"
            title={t('list.empty_title')}
            description={t('list.empty_description')}
            action={user ? { label: t('list.create_action'), href: '/civic-questions/create' } : undefined}
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
