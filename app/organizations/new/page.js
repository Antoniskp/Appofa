'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { organizationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), { ssr: false });

const INITIAL_FORM = {
  name: '',
  description: '',
  address: '',
  latitude: '',
  longitude: '',
  isPublic: false,
};

export default function NewOrganizationPage() {
  const t = useTranslations('organizations');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!user) {
      setFeedback({ tone: 'error', message: t('login_to_create_block') });
      return;
    }

    const hasLatitude = form.latitude !== '';
    const hasLongitude = form.longitude !== '';
    if (hasLatitude !== hasLongitude) {
      setFeedback({ tone: 'error', message: t('pin_requires_both_coordinates') });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await organizationAPI.create({
        name: form.name,
        type: 'block',
        description: form.description,
        address: form.address,
        latitude: hasLatitude ? Number(form.latitude) : null,
        longitude: hasLongitude ? Number(form.longitude) : null,
        isPublic: Boolean(form.isPublic),
      });
      const slug = response?.data?.organization?.slug;
      router.push(slug ? `/organizations/${slug}` : '/organizations');
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message || t('create_failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="app-container py-10">
        <SkeletonLoader type="card" count={1} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-2xl">
          <AlertMessage message={t('login_to_create_block')} />
          <Link href="/login" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {t('sign_in')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl">
        <Link href="/organizations" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('title')}
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">{t('create_block_title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('create_block_intro')}</p>
          </div>

          {feedback && <AlertMessage tone={feedback.tone} message={feedback.message} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                {t('name')}
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder={t('block_name_placeholder')}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                {t('address')}
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) => setField('address', event.target.value)}
                  placeholder={t('address_placeholder')}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                {t('description')}
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder={t('block_description_placeholder')}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <MapPinIcon className="h-4 w-4 text-blue-600" />
                {t('map_pin')}
              </div>
              <LocationPickerMap
                lat={form.latitude}
                lng={form.longitude}
                onChange={({ lat, lng }) => {
                  setForm((current) => ({
                    ...current,
                    latitude: lat.toFixed(7),
                    longitude: lng.toFixed(7),
                  }));
                }}
                className="h-72 w-full overflow-hidden rounded-lg"
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
                    onChange={(event) => setField('latitude', event.target.value)}
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
                    onChange={(event) => setField('longitude', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) => setField('isPublic', event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium text-gray-800">{t('is_public')}</span>
                <span className="text-gray-500">{t('block_public_help')}</span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? t('loading') : t('create_block_submit')}
              </button>
              <Link href="/organizations" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {t('cancel')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
