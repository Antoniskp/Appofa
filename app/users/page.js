'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { authAPI, personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import Pagination from '@/components/ui/Pagination';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import { getExpertiseTagLabel, resolveProfessionLabel } from '@/lib/utils/professionTaxonomy';

// ─── Constants ─────────────────────────────────────────────────────────────────

const USERS_PREVIEW_LIMIT = 6;
const USERS_FULL_PAGE_LIMIT = 20;

// ─── ClaimStatusBadge ──────────────────────────────────────────────────────────

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

// ─── PersonCard (fully clickable) ─────────────────────────────────────────────

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
    <Link
      href={href}
      className="group block min-w-0 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4 sm:p-5"
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
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
            <h2 className="min-w-0 max-w-full text-base font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {displayName}
            </h2>
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
                  className="inline-flex max-w-full items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 break-words"
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
    </Link>
  );
}

// ─── FilterBar (shared) ────────────────────────────────────────────────────────

function FilterBar({ filters, onFilterChange, onReset, resetKey, t }) {
  const hasActiveFilters = filters.search || filters.locationId;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex min-w-0 flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            aria-label={t('search_placeholder')}
            type="text"
            placeholder={t('search_placeholder')}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Home-location filter */}
        <LocationFilterBreadcrumb
          key={resetKey}
          value={filters.locationId}
          onChange={(id) => onFilterChange('locationId', id || '')}
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 sm:w-auto sm:whitespace-nowrap"
          >
            {t('clear_filters')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── UnifiedPanel ──────────────────────────────────────────────────────────────

function UnifiedPanel({ viewMode, filters, t, isAuthenticated, authLoading, onViewRegistered }) {
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  const showPersons = viewMode === 'all' || viewMode === 'persons';
  const showUsers = viewMode === 'all' || viewMode === 'registered';

  // Reset users page when filters or viewMode change
  useEffect(() => {
    setUsersPage(1);
  }, [filters, viewMode]);

  // Persons – infinite scroll (all / persons modes)
  const {
    items: persons,
    loading: personsLoading,
    initialLoading: personsInitialLoading,
    error: personsError,
    hasMore,
    loadMore,
    reset: personsReset,
  } = useInfiniteData(
    async (p, lim) => {
      if (!showPersons) return { items: [], hasMore: false };
      const params = { page: p, limit: lim };
      if (filters.search) params.search = filters.search;
      if (filters.locationId) params.locationId = filters.locationId;
      const res = await personAPI.getAll(params);
      return {
        items: res?.data?.profiles || [],
        hasMore: p < (res?.data?.pagination?.totalPages ?? 1),
      };
    },
    12,
    [filters, showPersons]
  );

  // Registered users – paginated (all / registered modes)
  const usersLimit = viewMode === 'all' ? USERS_PREVIEW_LIMIT : USERS_FULL_PAGE_LIMIT;
  const { data: usersData, loading: usersLoading, error: usersError } = useAsyncData(
    async () => {
      if (!showUsers || authLoading) return null;
      const params = { page: usersPage, limit: usersLimit };
      if (filters.search) params.search = filters.search;
      if (filters.locationId) params.locationId = filters.locationId;
      const res = await authAPI.searchUsers(params);
      if (res?.success) {
        setUsersTotalPages(res.data.pagination?.totalPages || 1);
        return { users: res.data.users || [], totalPages: res.data.pagination?.totalPages || 1 };
      }
      return { users: [], totalPages: 1 };
    },
    [usersPage, usersLimit, filters, isAuthenticated, authLoading, showUsers],
    { initialData: null }
  );

  const users = usersData?.users || [];

  const hasNoResults =
    !authLoading &&
    !personsError &&
    !usersError &&
    (!showPersons || (!personsInitialLoading && persons.length === 0)) &&
    (!showUsers || (!usersLoading && users.length === 0));

  return (
    <>
      {/* ── Registered users block ──────────────────────────────────────── */}
      {showUsers && (
        <div className={viewMode === 'all' && users.length > 0 ? 'mb-10' : undefined}>
          {usersError && (
            <EmptyState type="error" title={t('error_title')} description={t('error_description')} />
          )}

          {!usersLoading && users.length > 0 && (
            <>
              {viewMode === 'all' && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {t('tab_registered')}
                </h3>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                {users.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </div>

              {/* "See all" link in all mode, pagination in registered mode */}
              {viewMode === 'all' && usersTotalPages > 1 && onViewRegistered && (
                <button
                  type="button"
                  onClick={onViewRegistered}
                  className="mt-1 text-sm text-blue-600 hover:underline"
                >
                  {t('see_all_registered')}
                </button>
              )}
              {viewMode === 'registered' && (
                <Pagination
                  currentPage={usersPage}
                  totalPages={usersTotalPages}
                  onPageChange={setUsersPage}
                  onPrevious={() => setUsersPage((p) => Math.max(1, p - 1))}
                  onNext={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                />
              )}
            </>
          )}

          {!usersLoading && !usersError && users.length === 0 && viewMode === 'registered' && (
            <EmptyState
              type="empty"
              title={t('no_users_title')}
              description={filters.search ? t('no_users_search') : t('no_users_empty')}
            />
          )}
        </div>
      )}

      {/* ── Persons block ────────────────────────────────────────────────── */}
      {showPersons && (
        <>
          {personsError && (
            <EmptyState
              type="error"
              title={t('error_title')}
              description={t('error_description')}
              action={{ text: t('retry'), onClick: personsReset }}
            />
          )}

          {personsInitialLoading && <SkeletonLoader count={6} type="card" />}

          {!personsInitialLoading && !personsError && (
            <>
              {viewMode === 'all' && persons.length > 0 && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {t('tab_persons')}
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map((profile) => (
                  <PersonCard key={profile.id} profile={profile} t={t} />
                ))}
              </div>
            </>
          )}

          {!personsInitialLoading && !personsError && persons.length > 0 && (
            <LoadMoreTrigger
              hasMore={hasMore}
              loading={personsLoading}
              onLoadMore={loadMore}
              skeletonType="card"
              skeletonCount={3}
            />
          )}
        </>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {hasNoResults && <EmptyState message={t('empty')} />}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const t = useTranslations('users');
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

  const readUrlState = () => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    return {
      viewMode: ['registered', 'persons'].includes(requestedView) ? requestedView : 'all',
      filters: { search: params.get('search') || '', locationId: params.get('location') || '' },
    };
  };
  const [viewMode, setViewMode] = useState(() => typeof window === 'undefined' ? 'all' : readUrlState().viewMode);

  const [filters, setFilters] = useState(() => typeof window === 'undefined'
    ? { search: '', locationId: '' }
    : readUrlState().filters);

  // Increment to force LocationFilterBreadcrumb remount on reset
  const [filterResetKey, setFilterResetKey] = useState(0);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleViewModeChange(nextView) {
    const params = new URLSearchParams(window.location.search);
    if (nextView === 'all') params.delete('view');
    else params.set('view', nextView);
    const query = params.toString();
    window.history.pushState(null, '', query ? `/users?${query}` : '/users');
    setViewMode(nextView);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (viewMode !== 'all') params.set('view', viewMode);
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.locationId) params.set('location', filters.locationId);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `/users?${query}` : '/users');
  }, [viewMode, filters]);

  useEffect(() => {
    const syncFromUrl = () => {
      const state = readUrlState();
      setViewMode(state.viewMode);
      setFilters(state.filters);
      setFilterResetKey((key) => key + 1);
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  function handleReset() {
    setFilters({ search: '', locationId: '' });
    setFilterResetKey((k) => k + 1);
  }

  // Public user statistics
  const { data: userStats, loading: statsLoading } = useAsyncData(
    async () => {
      const response = await authAPI.getPublicUserStats();
      return response.success ? response.data : null;
    },
    [],
    { initialData: null }
  );

  const tabs = [
    { id: 'all', label: t('tab_all') },
    { id: 'registered', label: t('tab_registered') },
    { id: 'persons', label: t('tab_persons') },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-gray-500">{t('subtitle')}</p>
          </div>
          <Link href="/parliamentarians" className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100">
            Βουλευτές &amp; εκλογικός χάρτης
          </Link>
        </div>

        {/* Stats strip */}
        {!statsLoading && userStats && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 py-2.5 px-4 flex items-center gap-6 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-blue-600">{userStats.registeredUsers}</span>
              <span className="text-sm text-gray-600">{t('stats_community_members')}</span>
            </span>
          </div>
        )}

        {/* View mode tab bar + action buttons */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <div className="grid w-full grid-cols-3 gap-1 bg-white rounded-xl border border-gray-200 p-1 sm:w-auto sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleViewModeChange(tab.id)}
                aria-pressed={viewMode === tab.id}
                className={`min-w-0 px-2 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors truncate ${
                  viewMode === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Compact action buttons */}
          <Link
            href="/worthy-citizens"
            className="inline-flex min-w-0 max-w-full items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors sm:whitespace-nowrap"
          >
            🏆 {t('worthy_citizens_cta')}
          </Link>

          {isAuthenticated && (user?.role === 'moderator' || user?.role === 'admin') && (
            <Link
              href="/admin/persons/create"
            className="inline-flex min-w-0 max-w-full items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors sm:whitespace-nowrap"
            >
              + {t('create_person')}
            </Link>
          )}
        </div>

        {/* Shared filter bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          resetKey={filterResetKey}
          t={t}
        />

        {/* Unified results */}
        <UnifiedPanel
          viewMode={viewMode}
          filters={filters}
          t={t}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          onViewRegistered={() => handleViewModeChange('registered')}
        />
      </div>
    </div>
  );
}
