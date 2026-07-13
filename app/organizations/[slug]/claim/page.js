'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { organizationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ClaimOrganizationPage({ params }) {
  const { slug } = use(params);
  const t = useTranslations('organizations');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    roleTitle: '',
    contactEmail: '',
    website: '',
    supportingStatement: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: organization, loading, error } = useAsyncData(
    async () => {
      const res = await organizationAPI.getBySlug(slug);
      return res?.data?.organization || null;
    },
    [slug],
    { initialData: null }
  );

  if (!authLoading && !user) {
    router.replace(`/login?redirect=/organizations/${slug}/claim`);
    return null;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization?.id) return;
    if (form.supportingStatement.trim().length < 20) {
      setSubmitError(t('claim_statement_too_short'));
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await organizationAPI.submitClaim(organization.id, {
        roleTitle: form.roleTitle,
        contactEmail: form.contactEmail,
        website: form.website,
        supportingStatement: form.supportingStatement,
      });
      router.push(`/organizations/${slug}?claim=submitted`);
    } catch (claimError) {
      setSubmitError(claimError?.message || t('claim_submit_failed'));
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="app-container py-10">
        <SkeletonLoader count={1} type="card" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="app-container py-10">
        <AlertMessage message={error || t('not_found')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container mx-auto max-w-2xl">
        <Link href={`/organizations/${slug}`} className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          {t('back_to_organization')}
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{t('claim_title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('claim_subtitle')}</p>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            {organization.logo ? (
              <img src={organization.logo} alt={organization.name} className="h-12 w-12 rounded-lg border border-gray-200 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <BuildingOffice2Icon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{organization.name}</p>
              <p className="text-sm text-gray-500">{t(`type_${organization.type}`)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                {t('claim_role_title')}
                <input
                  type="text"
                  value={form.roleTitle}
                  onChange={(event) => updateField('roleTitle', event.target.value)}
                  placeholder={t('claim_role_placeholder')}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={120}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                {t('claim_contact_email')}
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  placeholder="name@example.org"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              {t('claim_website')}
              <input
                type="url"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
                placeholder="https://"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t('claim_statement')}
              <textarea
                value={form.supportingStatement}
                onChange={(event) => updateField('supportingStatement', event.target.value)}
                rows={6}
                required
                placeholder={t('claim_statement_placeholder')}
                className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {submitError && <AlertMessage message={submitError} />}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('claim_submitting') : t('claim_submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
