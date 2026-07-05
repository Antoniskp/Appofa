'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  FunnelIcon,
  MapPinIcon,
  ScaleIcon,
  UserGroupIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { personAPI, manifestAPI, candidateRegistrationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import SearchInput from '@/components/ui/SearchInput';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { CandidateRegistrationCard } from '@/components/locations/LocationCandidatesTab';
import locationRolesConfig from '@/config/locationRoles.json';

const PAGE_SIZE = 12;
const FEATURED_CANDIDATE_LIMIT = 6;
const DIRECT_DEMOCRACY_HINTS = ['direct', 'democracy', 'democratic', 'dimokrat', 'δημοκρα'];

function getDisplayName(profile, fallbackName) {
  const nativeName = `${profile.firstNameNative || ''} ${profile.lastNameNative || ''}`.trim();
  const englishName = `${profile.firstNameEn || ''} ${profile.lastNameEn || ''}`.trim();
  return nativeName || englishName || profile.nickname || profile.username || fallbackName;
}

function translateRole(t, roleKey) {
  if (!roleKey) return '';
  try {
    return t(`roles.${roleKey}`);
  } catch {
    return roleKey.replaceAll('_', ' ');
  }
}

function getRoleOptions(t) {
  return Object.entries(locationRolesConfig.roles || {}).flatMap(([locationType, roles]) =>
    roles.map((role) => ({
      value: role.key,
      label: translateRole(t, role.key) || role.titleEn || role.title || role.key,
      locationType,
    }))
  );
}

function pickDirectDemocracyManifest(manifests) {
  return manifests.find((manifest) => {
    const text = `${manifest.slug || ''} ${manifest.title || ''} ${manifest.description || ''}`.toLowerCase();
    return DIRECT_DEMOCRACY_HINTS.some((hint) => text.includes(hint));
  }) || manifests[0] || null;
}

function OfficeList({ roles = [], t }) {
  const activeRoles = roles.filter((role) => role?.isActive !== false);
  if (activeRoles.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {activeRoles.slice(0, 3).map((role) => (
        <div key={role.id} className="flex items-start gap-2 text-sm text-gray-600">
          <ScaleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-gray-800">{translateRole(t, role.roleKey)}</p>
            {role.location?.name && (
              <p className="text-xs text-gray-500">{role.location.name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ManifestCommitment({ acceptances = [], selectedManifestSlug, t }) {
  const accepted = acceptances
    .filter((acceptance) => acceptance?.manifest)
    .filter((acceptance) => !selectedManifestSlug || acceptance.manifest.slug === selectedManifestSlug);

  if (accepted.length === 0) {
    return (
      <Badge variant="default" icon={<ClipboardDocumentCheckIcon />}>
        {t('card.no_pledge')}
      </Badge>
    );
  }

  return (
    <Badge variant="success" icon={<ClipboardDocumentCheckIcon />}>
      {t('card.manifest_accepted')}
    </Badge>
  );
}

function ActionCard({ icon: Icon, title, description, href, action }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start gap-4">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
            {action}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function IndependentCard({ profile, selectedManifestSlug, t }) {
  const name = getDisplayName(profile, t('card.fallback_name'));
  const photo = profile.photo || profile.avatar;
  const href = profile.slug ? `/persons/${profile.slug}` : '/users';
  const locationName = profile.homeLocation?.name || profile.constituency?.name || profile.location?.name;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start gap-4">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="h-16 w-16 flex-shrink-0 rounded-full border border-gray-100 object-cover"
          />
        ) : (
          <UserCircleIcon className="h-16 w-16 flex-shrink-0 text-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-gray-900 group-hover:text-blue-700">
              {name}
            </h2>
            {profile.claimStatus === 'claimed' && (
              <CheckBadgeIcon className="h-5 w-5 text-green-600" aria-label={t('card.verified_profile')} />
            )}
          </div>
          {locationName && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{locationName}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="primary">{t('card.independent')}</Badge>
            <ManifestCommitment
              acceptances={profile.manifestAcceptances || []}
              selectedManifestSlug={selectedManifestSlug}
              t={t}
            />
          </div>
        </div>
      </div>

      <OfficeList roles={profile.locationRoles || []} t={t} />

      {profile.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">{profile.bio}</p>
      )}

      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-blue-700">
        {t('card.view_profile')}
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function IndependentsPage() {
  const t = useTranslations('independents');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [committedOnly, setCommittedOnly] = useState(false);
  const [selectedManifestSlug, setSelectedManifestSlug] = useState('');

  const roleOptions = useMemo(() => getRoleOptions(t), [t]);

  const { data: manifests } = useAsyncData(
    async () => {
      const res = await manifestAPI.getAll();
      return res?.success ? res.data?.manifests || [] : [];
    },
    [],
    { initialData: [] }
  );

  useEffect(() => {
    if (selectedManifestSlug || manifests.length === 0) return;
    const directManifest = pickDirectDemocracyManifest(manifests);
    if (directManifest?.slug) {
      setSelectedManifestSlug(directManifest.slug);
    }
  }, [manifests, selectedManifestSlug]);

  useEffect(() => {
    setPage(1);
  }, [search, locationId, roleKey, committedOnly, selectedManifestSlug]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: PAGE_SIZE,
      independentOnly: 'true',
      officialOnly: 'true',
    };
    if (search.trim()) params.search = search.trim();
    if (locationId) params.locationId = locationId;
    if (roleKey) params.roleKey = roleKey;
    if (committedOnly) {
      if (selectedManifestSlug) params.manifestSlug = selectedManifestSlug;
      else params.hasManifestAcceptance = 'true';
    }
    return params;
  }, [page, search, locationId, roleKey, committedOnly, selectedManifestSlug]);

  const { data, loading, error } = useAsyncData(
    async () => {
      const res = await personAPI.getAll(queryParams);
      return res?.success ? res.data : { profiles: [], pagination: { totalPages: 1 } };
    },
    [queryParams],
    { initialData: { profiles: [], pagination: { totalPages: 1 } } }
  );

  const profiles = data?.profiles || [];
  const pagination = data?.pagination || { currentPage: page, totalPages: 1 };
  const selectedManifest = manifests.find((manifest) => manifest.slug === selectedManifestSlug);
  const {
    data: candidateData,
    loading: candidatesLoading,
    error: candidatesError,
  } = useAsyncData(
    async () => {
      const res = await candidateRegistrationAPI.getAll({
        page: 1,
        limit: FEATURED_CANDIDATE_LIMIT,
        partyMode: 'independent',
      });
      return res?.success ? res.data : { registrations: [], pagination: { totalItems: 0 } };
    },
    [],
    { initialData: { registrations: [], pagination: { totalItems: 0 } } }
  );
  const independentCandidates = candidateData?.registrations || [];
  const independentCandidateTotal = candidateData?.pagination?.totalItems || independentCandidates.length;
  const hasOfficeFilters = Boolean(search.trim() || locationId || roleKey || committedOnly);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="app-container py-10">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {t('hero.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
              {t('hero.description')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/candidates/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t('hero.register_cta')}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/candidates?partyMode=independent"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t('hero.browse_cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="app-container py-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <ActionCard
            icon={IdentificationIcon}
            title={t('actions.register_title')}
            description={t('actions.register_description')}
            href="/candidates/register"
            action={t('actions.register_action')}
          />
          <ActionCard
            icon={UserGroupIcon}
            title={t('actions.discover_title')}
            description={t('actions.discover_description')}
            href="/candidates?partyMode=independent"
            action={t('actions.discover_action')}
          />
          <ActionCard
            icon={ClipboardDocumentCheckIcon}
            title={t('actions.manifest_title')}
            description={t('actions.manifest_description')}
            href="/manifest-supporters"
            action={t('actions.manifest_action')}
          />
        </div>

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {t('candidates.eyebrow')}
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {t('candidates.title')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('candidates.description')}
              </p>
            </div>
            <Link
              href="/candidates?partyMode=independent"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('candidates.view_all')}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {candidatesLoading && (
            <div className="grid gap-4 lg:grid-cols-2">
              <SkeletonLoader count={4} type="card" />
            </div>
          )}

          {!candidatesLoading && candidatesError && (
            <EmptyState
              type="error"
              title={t('candidates.load_error_title')}
              description={candidatesError}
            />
          )}

          {!candidatesLoading && !candidatesError && independentCandidates.length === 0 && (
            <EmptyState
              type="empty"
              title={t('candidates.empty_title')}
              description={t('candidates.empty_description')}
              action={{ text: t('candidates.empty_action'), href: '/candidates/register' }}
            />
          )}

          {!candidatesLoading && !candidatesError && independentCandidates.length > 0 && (
            <>
              <p className="mb-3 text-sm text-gray-600">
                {t('candidates.showing', {
                  count: independentCandidates.length,
                  total: independentCandidateTotal,
                })}
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {independentCandidates.map((registration) => (
                  <CandidateRegistrationCard key={registration.id} registration={registration} />
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {t('officials.eyebrow')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {t('officials.title')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {t('officials.description')}
            </p>
          </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FunnelIcon className="h-5 w-5 text-blue-600" />
            {t('filters.title')}
          </div>
          <LocationFilterBreadcrumb value={locationId} onChange={(id) => setLocationId(id || '')} />
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('filters.search_placeholder')}
            />
            <select
              value={roleKey}
              onChange={(event) => setRoleKey(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.all_offices')}</option>
              {roleOptions.map((role) => (
                <option key={`${role.locationType}-${role.value}`} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              value={selectedManifestSlug}
              onChange={(event) => setSelectedManifestSlug(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.any_manifest')}</option>
              {manifests.map((manifest) => (
                <option key={manifest.slug} value={manifest.slug}>
                  {manifest.title}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900">
            <input
              type="checkbox"
              checked={committedOnly}
              onChange={(event) => setCommittedOnly(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <span>
              <span className="font-semibold">{t('filters.committed_only')}</span>
              <span className="block text-green-800/80">
                {selectedManifest
                  ? t('filters.uses_manifest', { title: selectedManifest.title })
                  : t('filters.uses_any_manifest')}
              </span>
            </span>
          </label>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonLoader count={6} type="card" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            type="error"
            title={t('states.load_error_title')}
            description={error}
          />
        )}

        {!loading && !error && profiles.length === 0 && (
          <EmptyState
            type="empty"
            title={t('states.empty_title')}
            description={hasOfficeFilters ? t('states.filtered_empty_description') : t('states.empty_description')}
          />
        )}

        {!loading && !error && profiles.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
              <p>
                {t('results.showing', { count: profiles.length })}
              </p>
              <p>
                {t('results.page_of', {
                  current: pagination.currentPage || page,
                  total: pagination.totalPages || 1,
                })}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <IndependentCard
                  key={profile.id}
                  profile={profile}
                  selectedManifestSlug={selectedManifestSlug}
                  t={t}
                />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages || 1}
              onPageChange={setPage}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(pagination.totalPages || 1, current + 1))}
            />
          </>
        )}
        </section>
      </div>
    </div>
  );
}
