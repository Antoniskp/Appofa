'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { organizationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

const ORGANIZATION_TYPES = ['company', 'organization', 'institution', 'school', 'university', 'party'];

const INITIAL_FORM = {
  name: '',
  type: 'organization',
  description: '',
  logo: '',
  website: '',
  contactEmail: '',
  locationId: '',
  isPublic: true,
};

export default function AdminOrganizationsPage() {
  const t = useTranslations('organizations');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
        locationId: target.locationId ? String(target.locationId) : '',
        isPublic: target.isPublic !== false,
      });
    }
  }, [organizations, searchParams]);

  const sortedOrganizations = useMemo(
    () => [...organizations].sort((a, b) => a.name.localeCompare(b.name, 'el')),
    [organizations]
  );

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
      isPublic: Boolean(form.isPublic),
    };

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
      locationId: organization.locationId ? String(organization.locationId) : '',
      isPublic: organization.isPublic !== false,
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingOrganization ? t('edit') : t('create')}</h2>
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

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
              />
              {t('is_public')}
            </label>

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

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3">{t('name')}</th>
                <th className="text-left px-4 py-3">{t('type')}</th>
                <th className="text-left px-4 py-3">{t('is_verified')}</th>
                <th className="text-left px-4 py-3">{t('is_public')}</th>
                <th className="text-left px-4 py-3">{t('created_by')}</th>
                <th className="text-left px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrganizations.map((organization) => (
                <tr key={organization.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{organization.name}</td>
                  <td className="px-4 py-3">{t(`type_${organization.type}`)}</td>
                  <td className="px-4 py-3">{organization.isVerified ? t('yes') : t('no')}</td>
                  <td className="px-4 py-3">{organization.isPublic ? t('yes') : t('no')}</td>
                  <td className="px-4 py-3">{organization.createdBy?.username || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleEdit(organization)} className="px-3 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50">{t('edit')}</button>
                      {user.role === 'admin' && (
                        <button type="button" onClick={() => handleDelete(organization)} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">{t('delete')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedOrganizations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">{t('no_organizations')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
