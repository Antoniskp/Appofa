'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowTopRightOnSquareIcon, CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { organizationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

import organizationTypesConfig from '@/config/organizationTypes.json';

const ORGANIZATION_TYPES = organizationTypesConfig.types;
const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), { ssr: false });

const INITIAL_FORM = {
  name: '',
  type: 'organization',
  description: '',
  logo: '',
  website: '',
  contactEmail: '',
  address: '',
  latitude: '',
  longitude: '',
  locationId: '',
  isPublic: true,
  isVerified: false,
};

export default function AdminOrganizationsPage() {
  const t = useTranslations('organizations');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [parentDrafts, setParentDrafts] = useState({});
  const [parentSavingId, setParentSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [claimProcessingId, setClaimProcessingId] = useState(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'moderator'].includes(user.role))) {
      router.replace('/');
    }
  }, [authLoading, router, user]);

  const { data: organizations, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await organizationAPI.getAll({ page: 1, limit: 100 });
      return res?.data?.organizations || [];
    },
    [],
    { initialData: [] }
  );

  const {
    data: pendingClaims,
    loading: claimsLoading,
    error: claimsError,
    refetch: refetchClaims,
  } = useAsyncData(
    async () => {
      if (!user || !['admin', 'moderator'].includes(user.role)) return [];
      const res = await organizationAPI.getPendingClaims({ page: 1, limit: 20 });
      return res?.data?.claims || [];
    },
    [user?.role],
    { initialData: [] }
  );

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || organizations.length === 0) return;

    const target = organizations.find((organization) => String(organization.id) === String(editId));
    if (target) {
      setEditingOrganization(target);
      setForm({
        name: target.name || '',
        type: target.type || 'organization',
        description: target.description || '',
        logo: target.logo || '',
        website: target.website || '',
        contactEmail: target.contactEmail || '',
        address: target.address || '',
        latitude: target.latitude != null ? String(target.latitude) : '',
        longitude: target.longitude != null ? String(target.longitude) : '',
        locationId: target.locationId ? String(target.locationId) : '',
        isPublic: target.isPublic !== false,
        isVerified: target.isVerified === true,
      });
    }
  }, [organizations, searchParams]);

  const sortedOrganizations = useMemo(
    () => [...organizations].sort((a, b) => a.name.localeCompare(b.name, locale || 'el')),
    [organizations, locale]
  );

  const filteredOrganizations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedOrganizations;
    return sortedOrganizations.filter((org) => org.name.toLowerCase().includes(q));
  }, [sortedOrganizations, searchQuery]);

  useEffect(() => {
    setParentDrafts((prev) => {
      const next = {};
      let changed = Object.keys(prev).length !== organizations.length;
      organizations.forEach((organization) => {
        const value = prev[organization.id] ?? (organization.parentId ? String(organization.parentId) : '');
        next[organization.id] = value;
        if (!changed && prev[organization.id] !== value) {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [organizations]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingOrganization(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      ...form,
      locationId: form.locationId ? Number(form.locationId) : null,
      latitude: form.latitude !== '' ? Number(form.latitude) : null,
      longitude: form.longitude !== '' ? Number(form.longitude) : null,
      isPublic: Boolean(form.isPublic),
    };
    if (isAdmin) {
      payload.isVerified = Boolean(form.isVerified);
    }

    try {
      if (editingOrganization) {
        await organizationAPI.update(editingOrganization.id, payload);
        setFeedback({ tone: 'success', message: t('updated_successfully') });
      } else {
        await organizationAPI.create(payload);
        setFeedback({ tone: 'success', message: t('created_successfully') });
      }
      resetForm();
      await refetch();
    } catch (submitError) {
      setFeedback({
        tone: 'error',
        message: editingOrganization ? t('update_failed') : t('create_failed'),
      });
      console.error('AdminOrganizationsPage submit error:', submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (organization) => {
    setEditingOrganization(organization);
    setForm({
      name: organization.name || '',
      type: organization.type || 'organization',
      description: organization.description || '',
      logo: organization.logo || '',
      website: organization.website || '',
      contactEmail: organization.contactEmail || '',
      address: organization.address || '',
      latitude: organization.latitude != null ? String(organization.latitude) : '',
      longitude: organization.longitude != null ? String(organization.longitude) : '',
      locationId: organization.locationId ? String(organization.locationId) : '',
      isPublic: organization.isPublic !== false,
      isVerified: organization.isVerified === true,
    });
  };

  const handleDelete = async (organization) => {
    if (!window.confirm(t('delete_confirm'))) return;

    try {
      await organizationAPI.delete(organization.id);
      setFeedback({ tone: 'success', message: t('deleted_successfully') });
      if (editingOrganization?.id === organization.id) {
        resetForm();
      }
      await refetch();
    } catch (deleteError) {
      setFeedback({ tone: 'error', message: t('delete_failed') });
      console.error('AdminOrganizationsPage delete error:', deleteError);
    }
  };

  const handleVerificationToggle = async (organization) => {
    if (!isAdmin) return;
    try {
      await organizationAPI.setVerified(organization.id, !organization.isVerified);
      setFeedback({ tone: 'success', message: t('verification_updated') });
      await refetch();
    } catch (toggleError) {
      setFeedback({ tone: 'error', message: t('verification_update_failed') });
      console.error('AdminOrganizationsPage verification toggle error:', toggleError);
    }
  };

  const handleSetParent = async (organization) => {
    const rawValue = (parentDrafts[organization.id] || '').trim();
    let parentId = null;
    if (rawValue && rawValue !== '0') {
      parentId = Number(rawValue);
      if (!Number.isInteger(parentId) || parentId <= 0) {
        setFeedback({ tone: 'error', message: t('update_failed') });
        return;
      }
    }

    setParentSavingId(organization.id);
    try {
      await organizationAPI.setParent(organization.id, parentId);
      setFeedback({ tone: 'success', message: parentId ? t('parent_set_success') : t('parent_cleared') });
      await refetch();
    } catch (setParentError) {
      const message = setParentError?.message || '';
      if (message.toLowerCase().includes('cycle')) {
        setFeedback({ tone: 'error', message: t('parent_cycle_error') });
      } else {
        setFeedback({ tone: 'error', message: message || t('update_failed') });
      }
      console.error('AdminOrganizationsPage set parent error:', setParentError);
    } finally {
      setParentSavingId(null);
    }
  };

  const handleApproveClaim = async (claim) => {
    setClaimProcessingId(claim.id);
    try {
      await organizationAPI.approveClaim(claim.id);
      setFeedback({ tone: 'success', message: t('claim_approved_success') });
      await Promise.all([refetch(), refetchClaims()]);
    } catch (claimError) {
      setFeedback({ tone: 'error', message: claimError?.message || t('claim_approve_failed') });
    } finally {
      setClaimProcessingId(null);
    }
  };

  const handleRejectClaim = async (claim) => {
    const reviewNotes = window.prompt(t('claim_reject_prompt')) || '';
    setClaimProcessingId(claim.id);
    try {
      await organizationAPI.rejectClaim(claim.id, { reviewNotes });
      setFeedback({ tone: 'success', message: t('claim_rejected_success') });
      await refetchClaims();
    } catch (claimError) {
      setFeedback({ tone: 'error', message: claimError?.message || t('claim_reject_failed') });
    } finally {
      setClaimProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="app-container py-10">
        <SkeletonLoader type="table" count={5} />
      </div>
    );
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        </div>

        {error && <AlertMessage message={t('error_loading')} className="mb-4" />}
        {feedback && <AlertMessage tone={feedback.tone} message={feedback.message} className="mb-4" />}

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('pending_claims')}</h2>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{pendingClaims.length}</span>
          </div>

          {claimsLoading && <SkeletonLoader type="list" count={2} />}
          {!claimsLoading && claimsError && <AlertMessage message={t('claims_error_loading')} />}
          {!claimsLoading && !claimsError && pendingClaims.length === 0 && (
            <p className="text-sm text-gray-500">{t('claims_empty')}</p>
          )}
          {!claimsLoading && !claimsError && pendingClaims.length > 0 && (
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/organizations/${claim.organization?.slug}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {claim.organization?.name || t('type_organization')}
                      </Link>
                      <p className="mt-1 text-sm text-gray-600">
                        {t('claimed_by')}: <Link href={`/users/${claim.user?.username}`} className="text-blue-600 hover:underline">@{claim.user?.username}</Link>
                        {claim.roleTitle && <span> · {claim.roleTitle}</span>}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-700">{claim.supportingStatement}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {claim.contactEmail && <span>{claim.contactEmail}</span>}
                        {claim.website && (
                          <a href={claim.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {claim.website}
                          </a>
                        )}
                        {claim.createdAt && <span>{new Date(claim.createdAt).toLocaleDateString(locale || 'el')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveClaim(claim)}
                        disabled={claimProcessingId === claim.id}
                        className="inline-flex items-center gap-1 rounded border border-green-200 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4" />
                        {t('approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectClaim(claim)}
                        disabled={claimProcessingId === claim.id}
                        className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        {t('reject')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingOrganization ? t('edit') : t('create')}</h2>
          {editingOrganization && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between gap-2">
              <span>{t('editing')}: <strong>{editingOrganization.name}</strong></span>
              <button type="button" onClick={resetForm} className="text-blue-600 hover:underline text-xs">{t('cancel')}</button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              {t('name')}
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700">
              {t('type')}
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {ORGANIZATION_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`type_${type}`)}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-700 md:col-span-2">
              {t('description')}
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700">
              {t('logo')}
              <input
                type="url"
                value={form.logo}
                onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700">
              {t('website')}
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700">
              {t('contact_email')}
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700 md:col-span-2">
              {t('address')}
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="text-sm text-gray-700">
              {t('location')}
              <input
                type="number"
                min="1"
                value={form.locationId}
                onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <div className="md:col-span-2 rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-sm font-medium text-gray-700">{t('map_pin')}</p>
              <LocationPickerMap
                lat={form.latitude}
                lng={form.longitude}
                onChange={({ lat, lng }) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat.toFixed(7),
                    longitude: lng.toFixed(7),
                  }));
                }}
                className="h-64 w-full overflow-hidden rounded-lg"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  {t('latitude')}
                  <input
                    type="number"
                    min="-90"
                    max="90"
                    step="0.0000001"
                    value={form.latitude}
                    onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  {t('longitude')}
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    step="0.0000001"
                    value={form.longitude}
                    onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                />
                {t('is_public')}
              </label>
              {isAdmin && (
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm((prev) => ({ ...prev, isVerified: e.target.checked }))}
                  />
                  {t('is_verified')}
                </label>
              )}
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? t('loading') : (editingOrganization ? t('edit') : t('create'))}
              </button>
              {editingOrganization && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-500">{filteredOrganizations.length} / {sortedOrganizations.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3">{t('address')}</th>
                  <th className="text-left px-4 py-3">{t('name')}</th>
                  <th className="text-left px-4 py-3">{t('type')}</th>
                  <th className="text-left px-4 py-3">{t('parent_org')}</th>
                  <th className="text-left px-4 py-3">{t('location')}</th>
                  <th className="text-left px-4 py-3">{t('is_verified')}</th>
                  <th className="text-left px-4 py-3">{t('is_public')}</th>
                  <th className="text-left px-4 py-3">{t('created_by')}</th>
                  <th className="text-left px-4 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.map((organization) => {
                  const isEditing = editingOrganization?.id === organization.id;
                  return (
                    <tr key={organization.id} className={`border-b border-gray-100 ${isEditing ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-gray-600">
                        {organization.address || (organization.latitude && organization.longitude ? t('map_pin') : 'â€”')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${isEditing ? 'text-blue-700' : 'text-gray-900'}`}>{organization.name}</span>
                          {organization.slug && (
                            <Link
                              href={`/organizations/${organization.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600"
                              title={t('view_profile')}
                            >
                              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t(`type_${organization.type}`)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {organization.parent ? (
                          <Link href={`/organizations/${organization.parent.slug}`} target="_blank" className="hover:text-blue-600 hover:underline">
                            {organization.parent.name}
                          </Link>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {organization.location ? (
                          <Link href={`/locations/${organization.location.slug}`} target="_blank" className="hover:text-blue-600 hover:underline">
                            {organization.location.name}
                          </Link>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {organization.isVerified ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('yes')}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">{t('no')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {organization.isPublic ? (
                          <span className="text-gray-600 text-xs">{t('yes')}</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">{t('no')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{organization.createdBy?.username || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => handleEdit(organization)} className={`px-3 py-1 rounded border text-xs ${isEditing ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}>{t('edit')}</button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleVerificationToggle(organization)}
                              className="px-3 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 text-xs"
                            >
                              {organization.isVerified ? t('unverify') : t('verify')}
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <button type="button" onClick={() => handleDelete(organization)} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs">{t('delete')}</button>
                          )}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={parentDrafts[organization.id] ?? ''}
                              onChange={(e) => setParentDrafts((prev) => ({ ...prev, [organization.id]: e.target.value }))}
                              className="px-2 py-1 rounded border border-gray-300 text-xs max-w-[140px]"
                            >
                              <option value="">— {t('no_parent')} —</option>
                              {sortedOrganizations
                                .filter((org) => org.id !== organization.id)
                                .map((org) => (
                                  <option key={org.id} value={String(org.id)}>{org.name}</option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSetParent(organization)}
                              disabled={parentSavingId === organization.id}
                              className="px-3 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 text-xs"
                            >
                              {t('set_parent')}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrganizations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery.trim() ? t('no_organizations_filtered') : t('no_organizations')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
