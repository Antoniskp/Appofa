'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  FlagIcon,
  MapPinIcon,
  MegaphoneIcon,
  ShareIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { organizationAPI } from '@/lib/api';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import { useFilters } from '@/hooks/useFilters';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';
import EmptyState from '@/components/ui/EmptyState';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';

import { useAuth } from '@/lib/auth-context';

import organizationTypesConfig from '@/config/organizationTypes.json';

const ORGANIZATION_TYPES = organizationTypesConfig.types;
const TYPE_DETAILS = {
  company: {
    icon: BriefcaseIcon,
    badge: 'bg-slate-100 text-slate-700',
    accent: 'bg-slate-50 text-slate-500',
  },
  organization: {
    icon: UserGroupIcon,
    badge: 'bg-blue-100 text-blue-700',
    accent: 'bg-blue-50 text-blue-500',
  },
  institution: {
    icon: BuildingLibraryIcon,
    badge: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-50 text-emerald-500',
  },
  school: {
    icon: AcademicCapIcon,
    badge: 'bg-amber-100 text-amber-800',
    accent: 'bg-amber-50 text-amber-600',
  },
  university: {
    icon: AcademicCapIcon,
    badge: 'bg-indigo-100 text-indigo-700',
    accent: 'bg-indigo-50 text-indigo-500',
  },
  party: {
    icon: FlagIcon,
    badge: 'bg-rose-100 text-rose-700',
    accent: 'bg-rose-50 text-rose-500',
  },
};

function OrganizationTypeBadge({ type, t }) {
  const detail = TYPE_DETAILS[type] || TYPE_DETAILS.organization;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${detail.badge}`}>
      {t(`type_${type}`)}
    </span>
  );
}

function OrganizationCard({ organization, t }) {
  const detail = TYPE_DETAILS[organization.type] || TYPE_DETAILS.organization;
  const TypeIcon = detail.icon;

  return (
    <Link href={`/organizations/${organization.slug}`} className="block h-full bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {organization.logo ? (
            <img src={organization.logo} alt={organization.name} className="h-14 w-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
          ) : (
            <div className={`h-14 w-14 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 ${detail.accent}`}>
              <TypeIcon className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{organization.name}</h2>
              <OrganizationTypeBadge type={organization.type} t={t} />
              {organization.isVerified && (
                <CheckBadgeIcon className="h-4 w-4 text-green-600" aria-label={t('verified_badge')} />
              )}
            </div>
            {organization.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{organization.description}</p>
            )}
            <p className="mt-3 text-xs leading-5 text-gray-500">{t(`type_hint_${organization.type}`)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              {organization.location && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {organization.location.name}
                </span>
              )}
              {organization.parent && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                  <ShareIcon className="h-3.5 w-3.5" />
                  {organization.parent.name}
                </span>
              )}
              {['party', 'institution'].includes(organization.type) && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                  <MegaphoneIcon className="h-3.5 w-3.5" />
                  {t('official_posts')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OrganizationsPage() {
  const t = useTranslations('organizations');
  const { user } = useAuth();
  const canCreateOrganization = ['admin', 'moderator'].includes(user?.role);
  const { filters, updateFilter } = useFilters({
    search: '',
    type: '',
    isVerified: false,
    hasOfficialPosts: false,
    hasLocation: false,
    hasChildren: false,
  });

  const { items: organizations, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (page, limit) => {
      const params = { page, limit };
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.isVerified) params.isVerified = true;
      if (filters.hasOfficialPosts) params.hasOfficialPosts = true;
      if (filters.hasLocation) params.hasLocation = true;
      if (filters.hasChildren) params.hasChildren = true;

      const res = await organizationAPI.getAll(params);
      const totalPages = res?.data?.pagination?.totalPages ?? 1;

      return {
        items: res?.data?.organizations || [],
        hasMore: page < totalPages,
      };
    },
    12,
    [filters]
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 text-2xl font-bold text-gray-900">{t('title')}</h1>
          {canCreateOrganization && (
            <Link
              href="/admin/organizations"
              className="inline-flex min-w-0 max-w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors sm:justify-start"
            >
              <span className="truncate">{t('create_button')}</span>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('all_types')}</option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>{t(`type_${type}`)}</option>
            ))}
          </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['isVerified', 'filter_verified'],
              ['hasOfficialPosts', 'filter_official_posts'],
              ['hasLocation', 'filter_local'],
              ['hasChildren', 'filter_branches'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateFilter(key, !filters[key])}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  filters[key]
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {key === 'isVerified' && <CheckBadgeIcon className="h-4 w-4" />}
                {key === 'hasOfficialPosts' && <MegaphoneIcon className="h-4 w-4" />}
                {key === 'hasLocation' && <MapPinIcon className="h-4 w-4" />}
                {key === 'hasChildren' && <ShareIcon className="h-4 w-4" />}
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {initialLoading && <SkeletonLoader count={6} type="card" />}
        {error && <AlertMessage message={t('error_loading')} />}

        {!initialLoading && !error && organizations.length === 0 && (
          <EmptyState message={t('no_organizations')} />
        )}

        {!error && organizations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} t={t} />
            ))}
          </div>
        )}

        {!initialLoading && !error && organizations.length > 0 && (
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
