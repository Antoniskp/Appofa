'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
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

function OrganizationTypeBadge({ type, t }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
      {t(`type_${type}`)}
    </span>
  );
}

function OrganizationCard({ organization, t }) {
  return (
    <Link href={`/organizations/${organization.slug}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {organization.logo ? (
            <img src={organization.logo} alt={organization.name} className="h-14 w-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <BuildingOffice2Icon className="h-7 w-7 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{organization.name}</h2>
              <OrganizationTypeBadge type={organization.type} t={t} />
            </div>
            {organization.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{organization.description}</p>
            )}
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
  const { filters, updateFilter } = useFilters({ search: '', type: '' });

  const { items: organizations, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (page, limit) => {
      const params = { page, limit };
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;

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
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          {canCreateOrganization && (
            <Link
              href="/admin/organizations"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t('create_button')}
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('all_types')}</option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>{t(`type_${type}`)}</option>
            ))}
          </select>
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
