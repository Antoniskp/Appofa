'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { authAPI, personAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/ui/Pagination';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';
import LoginLink from '@/components/ui/LoginLink';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import {
  DOMAINS,
  EXPERTISE_TAGS,
  getExpertiseTagLabel,
  resolveProfessionLabel,
  getSpecializations,
} from '@/lib/utils/professionTaxonomy';

// ─── PersonCard ────────────────────────────────────────────────────────────────

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

  const href = profile.slug ? `/persons/${profile.slug}` : '#';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start gap-4">
          {photo ? (
            <img
              src={photo}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-100"
            />
          ) : (
            <UserCircleIcon className="w-14 h-14 text-gray-300 flex-shrink-0" />
          )}

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

// ─── PersonsPanel ──────────────────────────────────────────────────────────────

function PersonsPanel({ t }) {
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
    <>
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

          {/* Claim status */}
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
    </>
  );
}

// ─── RegisteredUsersPanel ──────────────────────────────────────────────────────

function RegisteredUsersPanel({ t, isAuthenticated, authLoading }) {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    updateFilter,
    nextPage,
    prevPage,
    goToPage,
  } = useFilters({
    search: '',
    expertiseArea: '',
    locationId: null,
    domainId: '',
    professionId: '',
    specializationId: '',
  });

  const professionOptions = useMemo(() => {
    if (!filters.domainId) return [];
    const domain = DOMAINS.find((d) => d.id === filters.domainId);
    return domain ? domain.professions : [];
  }, [filters.domainId]);

  const specializationOptions = useMemo(() => {
    if (!filters.domainId || !filters.professionId) return [];
    return getSpecializations(filters.domainId, filters.professionId);
  }, [filters.domainId, filters.professionId]);

  function handleDomainChange(e) {
    updateFilter('domainId', e.target.value);
    updateFilter('professionId', '');
    updateFilter('specializationId', '');
  }

  function handleProfessionChange(e) {
    updateFilter('professionId', e.target.value);
    updateFilter('specializationId', '');
  }

  const { data: usersData, loading, error } = useAsyncData(
    async () => {
      if (authLoading) return null;
      if (!isAuthenticated) return { data: { users: [], pagination: { totalPages: 1 } } };

      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await authAPI.searchUsers(params);
      return { data: res?.success ? res.data : { users: [], pagination: { totalPages: 1 } } };
    },
    [page, filters, isAuthenticated, authLoading],
    {
      initialData: { users: [] },
      transform: (response) => {
        if (response === null) return undefined;
        setTotalPages(response.data.pagination?.totalPages || 1);
        return { users: response.data.users || [] };
      },
    }
  );

  const users = usersData?.users || [];
  const hasActiveTaxonomyFilter = filters.domainId || filters.professionId || filters.specializationId;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-700 mb-4">{t('login_prompt')}</p>
        <div className="flex justify-center gap-4">
          <LoginLink className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            {t('login')}
          </LoginLink>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('register')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('users_search_placeholder')}
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Expertise tag filter */}
      <div className="mb-3">
        <select
          value={filters.expertiseArea}
          onChange={(e) => updateFilter('expertiseArea', e.target.value)}
          className="h-10 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('all_expertise')}</option>
          {EXPERTISE_TAGS.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.label}</option>
          ))}
        </select>
      </div>

      {/* Taxonomy cascade filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={filters.domainId}
          onChange={handleDomainChange}
          aria-label={t('domain_label')}
          className="h-10 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">{t('all_domains')}</option>
          {DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>

        {professionOptions.length > 0 && (
          <select
            value={filters.professionId}
            onChange={handleProfessionChange}
            aria-label={t('profession_label')}
            className="h-10 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{t('all_professions')}</option>
            {professionOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        )}

        {specializationOptions.length > 0 && (
          <select
            value={filters.specializationId}
            onChange={(e) => updateFilter('specializationId', e.target.value)}
            aria-label={t('specialization_label')}
            className="h-10 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{t('all_specializations')}</option>
            {specializationOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        )}

        {hasActiveTaxonomyFilter && (
          <button
            type="button"
            onClick={() => {
              updateFilter('domainId', '');
              updateFilter('professionId', '');
              updateFilter('specializationId', '');
            }}
            className="h-10 px-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            ✕ {t('clear_domain')}
          </button>
        )}
      </div>

      {hasActiveTaxonomyFilter && (
        <p className="mb-3 text-xs text-blue-600">🎯 {t('specialist_mode')}</p>
      )}

      <div className="mb-8">
        <LocationFilterBreadcrumb
          value={filters.locationId}
          onChange={(locationId) => updateFilter('locationId', locationId)}
        />
      </div>

      {loading && <SkeletonLoader type="list" count={5} />}

      {error && (
        <EmptyState
          type="error"
          title={t('error_title')}
          description={error}
          action={{ text: t('retry'), onClick: () => window.location.reload() }}
        />
      )}

      {!loading && !error && users.length === 0 && (
        <EmptyState
          type="empty"
          title={t('no_users_title')}
          description={filters.search ? t('no_users_search') : t('no_users_empty')}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>

      {!loading && !error && users.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          onPrevious={prevPage}
          onNext={nextPage}
        />
      )}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const t = useTranslations('users');
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

  const [viewMode, setViewMode] = useState('persons');

  // Public user statistics
  const { data: userStats, loading: statsLoading } = useAsyncData(
    async () => {
      const response = await authAPI.getPublicUserStats();
      return response.success ? response.data : null;
    },
    [],
    { initialData: null }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Stats strip */}
        {!statsLoading && userStats && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 py-2.5 px-4 flex items-center gap-6 flex-wrap">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('stats_label')}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{t('stats_registered')}</span>
              <span className="text-lg font-bold text-blue-600">{userStats.totalUsers}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{t('stats_visible')}</span>
              <span className="text-lg font-bold text-green-600">{userStats.searchableUsers}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{t('stats_hidden')}</span>
              <span className="text-lg font-bold text-gray-500">{userStats.nonSearchableUsers}</span>
            </span>
          </div>
        )}

        {/* View mode toggle */}
        <div className="mb-6 flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          <button
            type="button"
            onClick={() => setViewMode('persons')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'persons'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🏛️ {t('tab_persons')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('registered')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'registered'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👤 {t('tab_registered')}
          </button>
          {isAuthenticated && (user?.role === 'moderator' || user?.role === 'admin') && (
            <Link
              href="/admin/persons/create"
              className="ml-2 inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
            >
              + {t('create_person')}
            </Link>
          )}
        </div>

        {/* Worthy citizens CTA */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{t('worthy_citizens_title')}</p>
              <p className="text-xs text-gray-500">{t('worthy_citizens_desc')}</p>
            </div>
          </div>
          <Link
            href="/worthy-citizens"
            className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
          >
            {t('worthy_citizens_cta')}
          </Link>
        </div>

        {/* Active panel */}
        {viewMode === 'persons' ? (
          <PersonsPanel t={t} />
        ) : (
          <RegisteredUsersPanel
            t={t}
            isAuthenticated={isAuthenticated}
            authLoading={authLoading}
          />
        )}
      </div>
    </div>
  );
}
