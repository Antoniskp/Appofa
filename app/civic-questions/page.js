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
    updateFilters,
    resetFilters,
  } = useFilters({ status: '', sourceType: '', category: '', location: '', sortBy: 'newest', search: '', myArea: '', closingSoon: '' });

  const [filterBarOpen, setFilterBarOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const { data: featured, loading: featuredLoading, error: featuredError } = useAsyncData(
    () => civicQuestionAPI.getFeatured(),
    [user?.id, user?.homeLocationId, user?.role],
    { transform: (response) => response.success ? response.data : null }
  );
  const activeFilters = Object.entries(filters).filter(([key, value]) => value && !(key === 'sortBy' && value === 'newest'));

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
        setTotal(response.pagination?.total || 0);
        return response.data || [];
      },
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <header className="mb-6 max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">{t('list.title')}</h1>
          <p className="mt-3 text-gray-700">{t('list.intro')}</p>
          <p className="mt-2 text-sm text-gray-600">{t('list.advisory')}</p>
        </header>
        {!featuredLoading && !featuredError && featured && (
          <section aria-labelledby="featured-issue" className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:p-8">
            <h2 id="featured-issue" className="text-sm font-bold uppercase tracking-wide text-blue-800">{t('featured.title')}</h2>
            <p className="mt-2 text-sm text-blue-800">{t('featured.reason')}</p>
            <h3 className="mt-4 max-w-4xl text-2xl font-bold leading-snug text-gray-900">{featured.title}</h3>
            {featured.simplified && <p className="mt-3 max-w-3xl line-clamp-3 leading-relaxed text-gray-700">{featured.simplified}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={`/civic-questions/${featured.id}`} className="inline-flex rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">{t('featured.action')}</Link>
              <p className="text-sm text-gray-700">{t('featured.participants', { count: featured.recentParticipants })}</p>
            </div>
          </section>
        )}
        <section aria-labelledby="participation-guide" className="mb-8 rounded-xl border border-blue-100 bg-white p-5 sm:p-6">
          <h2 id="participation-guide" className="text-xl font-semibold text-gray-900">{t('guide.title')}</h2>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">
            {['read', 'participate', 'results'].map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">{index + 1}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{t(`guide.${step}_title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{t(`guide.${step}_description`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <details className="mt-5 border-t border-gray-200 pt-4">
            <summary className="cursor-pointer font-medium text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{t('guide.faq_title')}</summary>
            <dl className="mt-4 grid gap-5 text-sm md:grid-cols-2">
              {['eligibility', 'statuses', 'source', 'visibility'].map((topic) => (
                <div key={topic}>
                  <dt className="font-semibold text-gray-900">{t(`guide.${topic}_question`)}</dt>
                  <dd className="mt-1 leading-relaxed text-gray-600">{t(`guide.${topic}_answer`)}</dd>
                </div>
              ))}
            </dl>
          </details>
        </section>
        <h2 className="text-xl font-semibold text-gray-900">{t('guide.browse_title')}</h2>
        <p className="mb-4 mt-2 text-sm text-gray-600">{t('guide.browse_description')}</p>
        <div className="flex flex-wrap gap-2 mb-5" aria-label={t('list.quick_filters')}>
          {[
            { label: t('list.all'), selected: !filters.status && !filters.closingSoon && !filters.myArea, values: { status: '', closingSoon: '', myArea: '', sortBy: 'newest' } },
            { label: t('list.open'), selected: filters.status === 'open' && !filters.closingSoon, values: { status: 'open', closingSoon: '', sortBy: 'newest' } },
            { label: t('list.sort_closing_soon'), selected: Boolean(filters.closingSoon), values: { status: 'open', closingSoon: 'true', sortBy: 'closing_soon' } },
            ...(user?.homeLocationId ? [{ label: t('list.my_area'), selected: Boolean(filters.myArea), values: { myArea: filters.myArea ? '' : 'true', location: '' } }] : []),
          ].map(({ label, selected, values }) => (
            <button key={label} type="button" aria-pressed={selected} onClick={() => updateFilters(values)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              {label}
            </button>
          ))}
        </div>
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
              onChange={(event) => {
                if (event.target.name === 'status') updateFilters({ status: event.target.value, closingSoon: '' });
                else handleFilterChange(event);
              }}
              defaultValues={{ sortBy: 'newest' }}
              toggleLabel={t('list.filters')}
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
                  placeholder: t('list.sort_newest'),
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
                className="inline-flex min-w-0 max-w-full items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium md:justify-start md:whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5 shrink-0" />
                <span className="truncate">{t('list.new_civic_question')}</span>
              </Link>
            )
          }
        />
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
          {!loading && !error && <span className="font-medium text-gray-700">{t('list.result_count', { count: total })}</span>}
          {activeFilters.map(([key, value]) => {
            const label = key === 'status' ? t(`status.${value}`)
              : key === 'sourceType' ? t(`source_types.${value}`)
                : key === 'myArea' ? t('list.my_area')
                  : key === 'closingSoon' ? t('list.sort_closing_soon')
                    : key === 'sortBy' ? t(`list.sort_${value}`) : value;
            return <button key={key} type="button" className="rounded-full bg-gray-100 px-3 py-1 text-gray-700" aria-label={t('list.remove_filter', { label })}
              onClick={() => key === 'status' ? updateFilters({ status: '', closingSoon: '' }) : updateFilter(key, key === 'sortBy' ? 'newest' : '')}>{label} ×</button>;
          })}
          {activeFilters.length > 0 && <button type="button" onClick={resetFilters} className="text-blue-700 underline">{t('list.clear')}</button>}
        </div>

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
