'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FunnelIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { civicQuestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import CivicQuestionCard from '@/components/civicQuestions/CivicQuestionCard';
import { useTranslations } from 'next-intl';

const ALL_FILTERS = { status: '', sourceType: '', category: '', location: '', sortBy: 'newest', search: '', myArea: '', closingSoon: '' };
const DEFAULT_FILTERS = { ...ALL_FILTERS, status: 'open' };
const CONTROL_CLASS = 'min-h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CivicQuestionsPage() {
  const t = useTranslations('civicQuestions');
  const { user } = useAuth();
  const {
    filters, page, totalPages, setTotalPages, handleFilterChange,
    nextPage, prevPage, goToPage, updateFilter, updateFilters,
  } = useFilters(DEFAULT_FILTERS);
  const [filterBarOpen, setFilterBarOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const { data: featured } = useAsyncData(
    () => civicQuestionAPI.getFeatured(),
    [user?.id, user?.homeLocationId, user?.role],
    { transform: (response) => response.success ? response.data : null }
  );
  const { data: categories, error: categoriesError, refetch: refetchCategories } = useAsyncData(
    () => civicQuestionAPI.getCategories(),
    [user?.id, user?.homeLocationId, user?.role],
    { initialData: [], transform: (response) => response.data || [] }
  );
  // Quick filters and search already show their selection; only advanced filters need removable chips.
  const activeFilters = Object.entries(filters).filter(([key, value]) => value && (
    ['sourceType', 'category', 'location'].includes(key) || (key === 'status' && value !== 'open')
  ));
  const filterCount = activeFilters.length;
  const hasCustomFilters = activeFilters.length > 0 || filters.search || filters.myArea || filters.closingSoon;
  const showAllIssues = () => updateFilters(ALL_FILTERS);
  const { data: civicQuestions, loading, error, refetch } = useAsyncData(
    async () => {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const response = await civicQuestionAPI.getAll(params);
      if (!response.success) throw new Error(response.message || t('list.error_description'));
      return response;
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
  const filterConfig = [
    { name: 'status', label: t('form.status'), options: [
      { value: '', label: t('list.all_statuses') },
      ...['open', 'closed', 'archived'].map((value) => ({ value, label: t(`status.${value}`) })),
    ] },
    { name: 'sourceType', label: t('list.source'), options: [
      { value: '', label: t('list.all_sources') },
      ...['parliament', 'european_commission', 'municipal_council', 'regional_council', 'other'].map((value) => ({ value, label: t(`source_types.${value}`) })),
    ] },
    { name: 'category', label: t('form.category'), options: [
      { value: '', label: t('list.all_categories') },
      ...(filters.category && !categories.includes(filters.category) ? [{ value: filters.category, label: filters.category }] : []),
      ...categories.map((value) => ({ value, label: value })),
    ] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-5 sm:py-8">
      <div className="app-container">
        <header className="mb-5">
          <h1 className="text-3xl font-bold text-gray-900">{t('list.title')}</h1>
          <p className="mt-2 text-base text-gray-700">{t('list.intro')}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('list.advisory')}</p>
          <details className="mt-2">
            <summary id="participation-guide" className="w-fit cursor-pointer rounded py-2 text-sm font-semibold text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{t('guide.title')}</summary>
            <div className="mt-2 rounded-xl border border-gray-200 bg-white p-5">
              {!user && <p className="mb-4 text-sm text-gray-700">{t('list.sign_in_note')}</p>}
              <ol className="grid gap-4 md:grid-cols-3">
                {['read', 'participate', 'results'].map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">{index + 1}</span>
                    <div><h2 className="font-semibold text-gray-900">{t(`guide.${step}_title`)}</h2><p className="mt-1 text-sm leading-relaxed text-gray-600">{t(`guide.${step}_description`)}</p></div>
                  </li>
                ))}
              </ol>
              <details className="mt-4 border-t border-gray-200 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-blue-800">{t('guide.faq_title')}</summary>
                <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                  {['eligibility', 'statuses', 'source', 'visibility'].map((topic) => (
                    <div key={topic}><dt className="font-semibold text-gray-900">{t(`guide.${topic}_question`)}</dt><dd className="mt-1 leading-relaxed text-gray-600">{t(`guide.${topic}_answer`)}</dd></div>
                  ))}
                </dl>
              </details>
            </div>
          </details>
        </header>
        {featured && (
          <section aria-labelledby="featured-issue" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h2 id="featured-issue" className="text-sm font-semibold text-blue-800">{t('featured.title')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t('featured.reason')}</p>
            <Link href={`/civic-questions/${featured.id}`} className="mt-2 block rounded text-lg font-semibold text-gray-900 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{featured.title} <span aria-hidden="true">→</span></Link>
            <p className="mt-2 text-sm text-gray-700">{t('featured.participants', { count: featured.recentParticipants })}</p>
          </section>
        )}
        <section id="issue-list" aria-labelledby="issue-list-heading" className="scroll-mt-6">
          <h2 id="issue-list-heading" className="sr-only">{t('guide.browse_title')}</h2>
          <div className="mb-3 flex flex-wrap gap-2" aria-label={t('list.quick_filters')}>
            {[
              { label: t('list.all'), selected: !Object.entries(filters).some(([key, value]) => key !== 'sortBy' && value), values: ALL_FILTERS },
              { label: t('list.open'), selected: filters.status === 'open' && !filters.closingSoon, values: { status: 'open', closingSoon: '' } },
              { label: t('list.sort_closing_soon'), selected: Boolean(filters.closingSoon), values: { status: 'open', closingSoon: 'true', sortBy: 'closing_soon' } },
              ...(user?.homeLocationId ? [{ label: t('list.my_area'), selected: Boolean(filters.myArea), values: { myArea: filters.myArea ? '' : 'true', location: '' } }] : []),
            ].map(({ label, selected, values }) => (
              <button key={label} type="button" aria-pressed={selected} onClick={() => updateFilters(values)} className={`min-h-11 rounded-full border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}>{label}</button>
            ))}
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <label htmlFor="civic-question-search" className="sr-only">{t('list.search_placeholder')}</label>
              <SearchInput id="civic-question-search" name="search" placeholder={t('list.search_placeholder')} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} className="w-full" />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-expanded={filterBarOpen} aria-controls="civic-filters" onClick={() => setFilterBarOpen((prev) => !prev)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">
                <FunnelIcon aria-hidden="true" className="h-4 w-4" />{t('list.filters')}
                {filterCount > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{filterCount}</span>}
              </button>
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-600">
                <span className="sr-only sm:not-sr-only">{t('list.sort')}</span>
                <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} aria-label={t('list.sort')} className={CONTROL_CLASS}>
                  {['newest', 'closing_soon', 'most_voted'].map((value) => <option key={value} value={value}>{t(`list.sort_${value}`)}</option>)}
                </select>
              </label>
            </div>
          </div>
          {filterBarOpen && (
            <div id="civic-filters" className="mt-3 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
              {filterConfig.map(({ name, label, options }) => (
                <label key={name} className="min-w-0 text-sm font-medium text-gray-700">{label}
                  <select name={name} value={filters[name]} onChange={(event) => name === 'status' ? updateFilters({ status: event.target.value, closingSoon: '' }) : handleFilterChange(event)} className={`${CONTROL_CLASS} mt-1`}>
                    {options.map(({ value, label: optionLabel }) => <option key={value} value={value}>{optionLabel}</option>)}
                  </select>
                </label>
              ))}
              <label className="min-w-0 text-sm font-medium text-gray-700">{t('form.location')}<input name="location" value={filters.location} onChange={handleFilterChange} placeholder={t('list.location_placeholder')} className={`${CONTROL_CLASS} mt-1`} /></label>
              {categoriesError && <p role="status" className="text-sm text-gray-600 sm:col-span-2 lg:col-span-4">{t('list.categories_error')} <button type="button" onClick={refetchCategories} className="font-medium text-blue-700 underline">{t('list.retry')}</button></p>}
            </div>
          )}
          <div className="my-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
              {loading ? <span role="status" className="text-gray-600">{t('list.loading')}</span> : !error && <span className="font-medium text-gray-700">{t('list.result_count', { count: total })}</span>}
              {activeFilters.map(([key, value]) => {
                const label = key === 'status' ? t(`status.${value}`) : key === 'sourceType' ? t(`source_types.${value}`) : value;
                return <button key={key} type="button" className="rounded-full bg-gray-100 px-3 py-2 text-gray-700" aria-label={t('list.remove_filter', { label })} onClick={() => updateFilter(key, '')}>{label} ×</button>;
              })}
              {hasCustomFilters && <button type="button" onClick={() => updateFilters(DEFAULT_FILTERS)} className="py-2 text-blue-700 underline">{t('list.clear')}</button>}
            </div>
            {user && <Link href="/civic-questions/create" className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-blue-700 hover:underline"><PlusCircleIcon aria-hidden="true" className="h-4 w-4" />{t('list.new_civic_question')}</Link>}
          </div>
          {loading && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"><SkeletonLoader type="card" count={6} /></div>}
          {error && <EmptyState type="error" title={t('list.error_title')} description={error} action={{ text: t('list.retry'), onClick: refetch }} />}
          {!loading && !error && civicQuestions.length === 0 && <EmptyState type="empty" title={t('list.empty_title')} description={t('list.empty_description')} action={Object.values(filters).some((value) => value && value !== 'newest') ? { text: t('list.show_all'), onClick: showAllIssues } : user ? { text: t('list.create_action'), href: '/civic-questions/create' } : undefined} />}
          {!loading && !error && civicQuestions.length > 0 && <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{civicQuestions.map((civicQuestion) => <CivicQuestionCard key={civicQuestion.id} civicQuestion={civicQuestion} />)}</div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={goToPage} onNext={nextPage} onPrevious={prevPage} />
          </>}
        </section>
      </div>
    </div>
  );
}
