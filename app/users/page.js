'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  ChevronDownIcon,
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
import LoginLink from '@/components/ui/LoginLink';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import {
  DOMAINS,
  EXPERTISE_TAG_GROUPS,
  getExpertiseTagLabel,
  getSpecializations,
  resolveProfessionLabel,
} from '@/lib/utils/professionTaxonomy';

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
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5"
    >
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
            <h2 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
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
    </Link>
  );
}

// ─── FilterBar (shared) ────────────────────────────────────────────────────────

function FilterBar({ filters, onFilterChange, onReset, resetKey, t }) {
  const [expertiseOpen, setExpertiseOpen] = useState(false);
  const [openExpertiseGroups, setOpenExpertiseGroups] = useState(new Set());
  const expertiseRef = useRef(null);

  // Close expertise dropdown on outside click
  useEffect(() => {
    if (!expertiseOpen) return;
    function handleClickOutside(e) {
      if (expertiseRef.current && !expertiseRef.current.contains(e.target)) {
        setExpertiseOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expertiseOpen]);

  // Auto-open the group whose tag is currently selected
  useEffect(() => {
    if (!filters.expertiseArea) return;
    for (const { domain, tags } of EXPERTISE_TAG_GROUPS) {
      if (tags.some((tag) => tag.id === filters.expertiseArea)) {
        setOpenExpertiseGroups((prev) => new Set([...prev, domain.id]));
        break;
      }
    }
  }, [filters.expertiseArea]);

  const toggleExpertiseGroup = (domainId) => {
    setOpenExpertiseGroups((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  // Cascade-aware domain change: reset profession + specialization
  function handleDomainChange(value) {
    onFilterChange('domainId', value);
    onFilterChange('professionId', '');
    onFilterChange('specializationId', '');
  }

  // Cascade-aware profession change: reset specialization
  function handleProfessionChange(value) {
    onFilterChange('professionId', value);
    onFilterChange('specializationId', '');
  }

  // Professions for the selected domain
  const professionList = useMemo(() => {
    if (!filters.domainId) return [];
    const domain = DOMAINS.find((d) => d.id === filters.domainId);
    return domain ? domain.professions : [];
  }, [filters.domainId]);

  // Specializations for the selected profession
  const specializationList = useMemo(
    () => getSpecializations(filters.domainId, filters.professionId),
    [filters.domainId, filters.professionId]
  );

  const selectedDomain = DOMAINS.find((d) => d.id === filters.domainId);
  const selectedExpertiseLabel = filters.expertiseArea
    ? getExpertiseTagLabel(filters.expertiseArea)
    : t('all_expertise');

  const hasActiveFilters =
    filters.search || filters.locationId || filters.domainId || filters.expertiseArea;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      {/* Home-location breadcrumb filter */}
      <LocationFilterBreadcrumb
        key={resetKey}
        value={filters.locationId}
        onChange={(id) => onFilterChange('locationId', id || '')}
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Domain */}
        <select
          value={filters.domainId}
          onChange={(e) => handleDomainChange(e.target.value)}
          className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px] ${
            filters.domainId ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
          }`}
        >
          <option value="">{t('all_professions')}</option>
          {DOMAINS.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.label}
            </option>
          ))}
        </select>

        {/* Profession (shown when a domain is selected) */}
        {filters.domainId && professionList.length > 0 && (
          <select
            value={filters.professionId}
            onChange={(e) => handleProfessionChange(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px] ${
              filters.professionId ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
            }`}
          >
            <option value="">{t('all_professions')} — {selectedDomain?.label}</option>
            {professionList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        {/* Specialization (shown when a profession with specs is selected) */}
        {filters.professionId && specializationList.length > 0 && (
          <select
            value={filters.specializationId}
            onChange={(e) => onFilterChange('specializationId', e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px] ${
              filters.specializationId ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
            }`}
          >
            <option value="">{t('all_specializations')}</option>
            {specializationList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {/* Expertise – custom accordion dropdown */}
        <div className="relative" ref={expertiseRef}>
          <button
            type="button"
            onClick={() => setExpertiseOpen((v) => !v)}
            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px] inline-flex items-center justify-between gap-2 ${
              filters.expertiseArea
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700'
            }`}
          >
            <span className="truncate max-w-[140px]">{selectedExpertiseLabel}</span>
            <ChevronDownIcon
              className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${expertiseOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {expertiseOpen && (
            <div className="absolute z-30 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              {/* "All" option */}
              <button
                type="button"
                onClick={() => { onFilterChange('expertiseArea', ''); setExpertiseOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !filters.expertiseArea ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                {t('all_expertise')}
              </button>

              {/* Grouped accordion */}
              {EXPERTISE_TAG_GROUPS.map(({ domain, tags }) => {
                const isOpen = openExpertiseGroups.has(domain.id);
                const isActiveGroup = tags.some((tag) => tag.id === filters.expertiseArea);

                return (
                  <div key={domain.id} className="border-b border-gray-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleExpertiseGroup(domain.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-left transition-colors ${
                        isActiveGroup ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{domain.label}</span>
                      <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {isOpen && (
                      <div className="pb-2 px-3 pt-1 flex flex-wrap gap-1.5 bg-gray-50">
                        {tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => { onFilterChange('expertiseArea', tag.id); setExpertiseOpen(false); }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs transition ${
                              filters.expertiseArea === tag.id
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'border border-purple-300 text-purple-700 hover:bg-purple-50'
                            }`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
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
      if (filters.domainId) params.domainId = filters.domainId;
      if (filters.professionId) params.professionId = filters.professionId;
      if (filters.specializationId) params.specializationId = filters.specializationId;
      if (filters.expertiseArea) params.expertiseArea = filters.expertiseArea;
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
      if (!isAuthenticated) return { users: [], totalPages: 1 };
      const params = { page: usersPage, limit: usersLimit };
      if (filters.search) params.search = filters.search;
      if (filters.locationId) params.locationId = filters.locationId;
      if (filters.domainId) params.domainId = filters.domainId;
      if (filters.professionId) params.professionId = filters.professionId;
      if (filters.specializationId) params.specializationId = filters.specializationId;
      if (filters.expertiseArea) params.expertiseArea = filters.expertiseArea;
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
    (!showUsers || !isAuthenticated || (!usersLoading && users.length === 0));

  return (
    <>
      {/* ── Registered users block ──────────────────────────────────────── */}
      {showUsers && (
        <div className={viewMode === 'all' && users.length > 0 ? 'mb-10' : undefined}>
          {/* Auth gate */}
          {!authLoading && !isAuthenticated && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center mb-6">
              <p className="text-gray-700 mb-4">{t('login_prompt')}</p>
              <div className="flex justify-center gap-3">
                <LoginLink className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  {t('login')}
                </LoginLink>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {t('register')}
                </Link>
              </div>
            </div>
          )}

          {isAuthenticated && usersError && (
            <EmptyState type="error" title={t('error_title')} description={t('error_description')} />
          )}

          {isAuthenticated && !usersLoading && users.length > 0 && (
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

          {isAuthenticated && !usersLoading && !usersError && users.length === 0 && viewMode === 'registered' && (
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

  const [viewMode, setViewMode] = useState('all');

  const [filters, setFilters] = useState({
    search: '',
    locationId: '',
    domainId: '',
    professionId: '',
    specializationId: '',
    expertiseArea: '',
  });

  // Increment to force LocationFilterBreadcrumb remount on reset
  const [filterResetKey, setFilterResetKey] = useState(0);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setFilters({ search: '', locationId: '', domainId: '', professionId: '', specializationId: '', expertiseArea: '' });
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

        {/* View mode tab bar + action buttons */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors whitespace-nowrap"
          >
            🏆 {t('worthy_citizens_cta')}
          </Link>

          {isAuthenticated && (user?.role === 'moderator' || user?.role === 'admin') && (
            <Link
              href="/admin/persons/create"
              className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
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
          onViewRegistered={() => setViewMode('registered')}
        />
      </div>
    </div>
  );
}
