'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { candidateRegistrationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import LocationSelector from '@/components/ui/LocationSelector';
import { CandidateRegistrationCard } from '@/components/locations/LocationCandidatesTab';

const POSITION_OPTIONS = ['mayor', 'parliamentary', 'local_council', 'county_council', 'regional_council', 'other'];
const STATUS_OPTIONS = ['approved', 'submitted', 'rejected', 'archived', 'all'];

export default function CandidatesPage() {
  const t = useTranslations('candidates');
  const { user } = useAuth();
  const isStaff = ['admin', 'moderator'].includes(user?.role);
  const [locationKey, setLocationKey] = useState(0);
  const { filters, updateFilter } = useFilters({
    search: '',
    locationId: '',
    positionType: '',
    electionCycle: '',
    partyMode: '',
    status: 'approved',
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('partyMode') === 'independent') {
      updateFilter('partyMode', 'independent');
    }
  }, [updateFilter]);

  const { items: registrations, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (page, limit) => {
      const params = { page, limit };
      if (filters.search) params.search = filters.search;
      if (filters.locationId) params.locationId = filters.locationId;
      if (filters.positionType) params.positionType = filters.positionType;
      if (filters.electionCycle) params.electionCycle = filters.electionCycle;
      if (filters.partyMode) params.partyMode = filters.partyMode;
      if (isStaff && filters.status) params.status = filters.status;
      const res = await candidateRegistrationAPI.getAll(params);
      const totalPages = res?.data?.pagination?.totalPages ?? 1;
      return {
        items: res?.data?.registrations || [],
        hasMore: page < totalPages,
      };
    },
    12,
    [filters, isStaff]
  );

  const clearFilters = () => {
    updateFilter('search', '');
    updateFilter('locationId', '');
    updateFilter('positionType', '');
    updateFilter('electionCycle', '');
    updateFilter('partyMode', '');
    updateFilter('status', 'approved');
    setLocationKey((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('page_title')}</h1>
            <p className="mt-1 text-gray-600">{t('page_description')}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile#candidates" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('my_registrations')}
            </Link>
            <Link href="/candidates/register" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {t('register')}
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{t('section_title')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {t('section_description')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateFilter('partyMode', 'independent')}
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                {t('show_independent')}
              </button>
              <button
                type="button"
                onClick={() => updateFilter('partyMode', 'party')}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('show_party')}
              </button>
            </div>
          </div>
          <Link
            href="/independents"
            className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t('independent_lane_eyebrow')}</p>
            <h2 className="mt-2 text-base font-semibold text-gray-900">{t('independent_officials_title')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {t('independent_officials_description')}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
              {t('open_independents')}
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative lg:col-span-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="lg:col-span-2">
              <LocationSelector
                key={locationKey}
                value={filters.locationId}
                onChange={(value) => updateFilter('locationId', value || '')}
                placeholder={t('any_location')}
                allowClear
              />
            </div>
            <select
              value={filters.positionType}
              onChange={(event) => updateFilter('positionType', event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Position type"
            >
              <option value="">{t('all_positions')}</option>
              {POSITION_OPTIONS.map((position) => (
                <option key={position} value={position}>{t(`position_types.${position}`)}</option>
              ))}
            </select>
            <input
              value={filters.electionCycle}
              onChange={(event) => updateFilter('electionCycle', event.target.value)}
              placeholder={t('election_cycle_placeholder')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.partyMode}
              onChange={(event) => updateFilter('partyMode', event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Party mode"
            >
              <option value="">{t('party_or_independent')}</option>
              <option value="independent">{t('independent_only')}</option>
              <option value="party">{t('party_only')}</option>
            </select>
            {isStaff && (
              <select
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Status"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status === 'all' ? t('all_statuses') : status}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('clear')}
            </button>
          </div>
        </div>

        {initialLoading && <SkeletonLoader count={6} type="card" />}
        {error && <p className="py-8 text-center text-red-600">{t('failed_to_load')}</p>}

        {!initialLoading && !error && registrations.length === 0 && (
          <EmptyState message={t('no_results')} />
        )}

        {!error && registrations.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {registrations.map((registration) => (
              <CandidateRegistrationCard key={registration.id} registration={registration} />
            ))}
          </div>
        )}

        {!initialLoading && !error && registrations.length > 0 && (
          <LoadMoreTrigger
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            skeletonType="card"
            skeletonCount={2}
          />
        )}
      </div>
    </div>
  );
}
