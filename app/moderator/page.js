'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ShieldCheckIcon,
  MapPinIcon,
  FlagIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { authAPI, messageAPI, onboardingEventAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

function ModeratorWorkspaceContent() {
  const t = useTranslations('moderator');
  const { user } = useAuth();

  // Load moderator's assigned location roles
  const {
    data: locationData,
    loading: locationLoading,
    error: locationError,
  } = useAsyncData(
    async () => {
      if (!user?.id) return null;
      // Use the onboarding endpoint to get location role info
      const res = await authAPI.getOnboarding();
      if (res.success) return res.data.onboarding;
      return null;
    },
    [user?.id],
    { initialData: null }
  );

  // Load moderator application to get the requested location
  const { data: modData, loading: modLoading } = useAsyncData(
    async () => {
      if (!user?.id) return null;
      const res = await messageAPI.getMyModeratorApplication();
      if (res.success) return res.data;
      return null;
    },
    [user?.id],
    { initialData: null }
  );

  // Record workspace viewed event once on mount
  useEffect(() => {
    if (user?.id) {
      onboardingEventAPI.record({
        eventType: 'onboarding_viewed',
        goal: 'moderator',
      }).catch(() => {/* fire-and-forget */});
    }
  }, [user?.id]);

  const homeLocationId = locationData?.homeLocationId;
  const assignedLocation = modData?.application?.location;

  // Build the first-actions checklist
  const firstActions = [
    {
      key: 'review_location',
      icon: MapPinIcon,
      label: t('action_review_location'),
      description: t('action_review_location_desc'),
      href: assignedLocation
        ? `/locations/${assignedLocation.slug}`
        : homeLocationId
          ? '/locations'
          : '/locations',
    },
    {
      key: 'check_reports',
      icon: FlagIcon,
      label: t('action_check_reports'),
      description: t('action_check_reports_desc'),
      href: '/admin/reports',
    },
    {
      key: 'review_sections',
      icon: DocumentTextIcon,
      label: t('action_review_sections'),
      description: t('action_review_sections_desc'),
      href: assignedLocation
        ? `/locations/${assignedLocation.slug}`
        : '/admin/locations',
    },
    {
      key: 'read_rules',
      icon: BookOpenIcon,
      label: t('action_read_rules'),
      description: t('action_read_rules_desc'),
      href: '/pages/community-rules',
    },
  ];

  if (locationLoading || modLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SkeletonLoader />
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AlertMessage type="error" message={t('load_error')} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheckIcon className="h-8 w-8 text-indigo-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>
      <p className="text-gray-600 mb-8">{t('subtitle')}</p>

      {/* Assigned location */}
      {assignedLocation && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 mb-6 flex items-center gap-3">
          <MapPinIcon className="h-5 w-5 text-indigo-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-indigo-900">{t('assigned_location')}</p>
            <Link
              href={`/locations/${assignedLocation.slug}`}
              className="text-indigo-700 hover:underline font-semibold"
            >
              {assignedLocation.name}
            </Link>
          </div>
        </div>
      )}

      {/* First-actions checklist */}
      <section aria-labelledby="first-actions-heading">
        <h2 id="first-actions-heading" className="text-lg font-semibold text-gray-800 mb-4">
          {t('first_actions_title')}
        </h2>
        <ul className="space-y-3" role="list">
          {firstActions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.key}>
                <Link
                  href={action.href}
                  className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <span className="mt-0.5 flex-shrink-0 rounded-md bg-indigo-100 p-2 group-hover:bg-indigo-200 transition-colors">
                    <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{action.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Quick admin links */}
      <section className="mt-8" aria-labelledby="admin-links-heading">
        <h2 id="admin-links-heading" className="text-lg font-semibold text-gray-800 mb-3">
          {t('admin_tools_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/admin', label: t('link_admin_dashboard') },
            { href: '/admin/reports', label: t('link_reports') },
            { href: '/admin/messages?type=moderator_application', label: t('link_applications') },
            { href: '/admin/users', label: t('link_users') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {link.label}
              <ChevronRightIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* Onboarding completion CTA */}
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5 flex items-start gap-3">
        <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-green-900">{t('activation_hint_title')}</p>
          <p className="text-sm text-green-800 mt-1">{t('activation_hint_body')}</p>
          <Link
            href="/onboarding"
            className="mt-2 inline-block text-sm font-medium text-green-700 hover:underline"
          >
            {t('activation_hint_cta')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ModeratorWorkspacePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <ModeratorWorkspaceContent />
    </ProtectedRoute>
  );
}
