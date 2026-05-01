'use client';

import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { personAPI, locationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';
import {
  DOMAINS,
  EXPERTISE_TAGS,
  getExpertiseTagLabel,
  resolveProfessionLabel,
} from '@/lib/utils/professionTaxonomy';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ClaimStatusBadge({ status, t }) {
  if (status === 'claimed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckBadgeIcon className="h-3 w-3" />
        {t('claimed')}
      </span>
    );
  }
  if (status === 'unclaimed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        {t('unclaimed')}
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        {t('pending')}
      </span>
    );
  }
  return null;
}

function PersonCard({ profile, t }) {
  const displayName =
    profile.firstNameNative && profile.lastNameNative
      ? `${profile.firstNameNative} ${profile.lastNameNative}`
      : profile.firstNameEn && profile.lastNameEn
        ? `${profile.firstNameEn} ${profile.lastNameEn}`
        : profile.fullName || '';

  const photo = profile.avatar || profile.photo;

  const professions = Array.isArray(profile.professions) ? profile.professions : [];
  const primaryProfession = professions.length > 0 ? resolveProfessionLabel(professions[0]) : null;

  const expertiseTagIds = Array.isArray(profile.expertiseArea) ? profile.expertiseArea : [];
  const visibleTags = expertiseTagIds.slice(0, 3);

  const location = profile.homeLocation?.name || profile.constituency?.name || null;

  const href = profile.slug
    ? `/persons/${profile.slug}`
    : profile.username
      ? `/users/${profile.username}`
      : '#';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start gap-4">
          {/* Photo */}
          {photo ? (
            <img
              src={photo}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-100"
            />
          ) : (
            <UserCircleIcon className="w-14 h-14 text-gray-300 flex-shrink-0" />
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{displayName}</h2>
              <ClaimStatusBadge status={profile.claimStatus} t={t} />
            </div>

            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 truncate">
                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                {location}
              </p>
            )}

            {primaryProfession && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 truncate">
                <BriefcaseIcon className="h-4 w-4 flex-shrink-0" />
                {primaryProfession}
              </p>
            )}

            {visibleTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                  >
                    {getExpertiseTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* View Profile button */}
      <div className="px-5 pb-4">
        <Link
          href={href}
          className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
        >
          {t('view_profile')}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DiscoverPeoplePage() {
  const t = useTranslations('discover_people');

  const { filters, updateFilter, resetFilters } = useFilters({
    search: '',
    locationId: '',
    domainId: '',
    expertiseArea: '',
    claimStatus: '',
  });

  const { data: locations } = useAsyncData(
    async () => {
      const res = await locationAPI.getAll({ limit: 200 });
      return Array.isArray(res?.locations) ? res.locations : [];
    },
    [],
    { initialData: [] }
  );

  const {
    items: persons,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    reset,
  } = useInfiniteData(
    async (p, lim) => {
      const params = { page: p, limit: lim };
      if (filters.search) params.search = filters.search;
      if (filters.locationId) params.locationId = filters.locationId;
      if (filters.domainId) params.domainId = filters.domainId;
      if (filters.expertiseArea) params.expertiseArea = filters.expertiseArea;
      if (filters.claimStatus) params.claimStatus = filters.claimStatus;
      const res = await personAPI.getAll(params);
      return {
        items: res?.data?.profiles || [],
        hasMore: p < (res?.data?.pagination?.totalPages ?? 1),
      };
    },
    12,
    [filters]
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v && v !== ''
  ).length;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location */}
            <select
              value={filters.locationId}
              onChange={(e) => updateFilter('locationId', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">{t('all_locations')}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Profession (domain) */}
            <select
              value={filters.domainId}
              onChange={(e) => updateFilter('domainId', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">{t('all_professions')}</option>
              {DOMAINS.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.label}
                </option>
              ))}
            </select>

            {/* Expertise */}
            <select
              value={filters.expertiseArea}
              onChange={(e) => updateFilter('expertiseArea', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">{t('all_expertise')}</option>
              {EXPERTISE_TAGS.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>

            {/* Claimed / Unclaimed */}
            <select
              value={filters.claimStatus}
              onChange={(e) => updateFilter('claimStatus', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">{t('all_profiles')}</option>
              <option value="claimed">{t('claimed')}</option>
              <option value="unclaimed">{t('unclaimed')}</option>
              <option value="pending">{t('pending')}</option>
            </select>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => resetFilters()}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                {t('clear_filters')}
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {initialLoading && <SkeletonLoader count={6} type="card" />}

        {error && (
          <EmptyState
            type="error"
            title={t('error_title')}
            description={t('error_description')}
            action={{ text: t('retry'), onClick: reset }}
          />
        )}

        {!initialLoading && !error && persons.length === 0 && (
          <EmptyState message={t('empty')} />
        )}

        {!error && persons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((profile) => (
              <PersonCard key={profile.id} profile={profile} t={t} />
            ))}
          </div>
        )}

        {!initialLoading && !error && persons.length > 0 && (
          <LoadMoreTrigger
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            skeletonType="card"
            skeletonCount={3}
          />
        )}
      </div>
    </div>
  );
}

