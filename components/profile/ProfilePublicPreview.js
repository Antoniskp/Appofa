'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import PublicProfileHeader from '@/components/profile/public/PublicProfileHeader';
import PublicProfileOverview from '@/components/profile/public/PublicProfileOverview';

export default function ProfilePublicPreview({
  user,
  profileData,
  displayBadge,
  interactionSettings,
}) {
  const t = useTranslations('profile');
  const [expanded, setExpanded] = useState(false);

  const previewUser = useMemo(() => ({
    ...profileData,
    id: user?.id,
    role: user?.role,
    isVerified: user?.isVerified,
    emailVerified: user?.emailVerified,
    createdAt: user?.createdAt,
    displayBadgeSlug: displayBadge?.slug || null,
    displayBadgeTier: displayBadge?.tier || null,
    profileVisibility: interactionSettings?.profileVisibility || 'registered',
  }), [displayBadge, interactionSettings, profileData, user]);

  return (
    <Card>
      <details className="group" onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="cursor-pointer list-none rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('public_preview_title')}</h2>
              <p className="text-sm text-gray-500">{t('public_preview_description')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex self-start rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {t(`visibility_${previewUser.profileVisibility}`)}
              </span>
              <span aria-hidden="true" className="text-gray-500 transition-transform group-open:rotate-180">⌄</span>
            </div>
          </div>
        </summary>
      {expanded && <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 space-y-5">
        <PublicProfileHeader
          user={previewUser}
          preview
          labels={{
            previewBadge: t('public_preview_badge'),
            memberSince: t('public_member_since_prefix'),
            fallbackName: t('public_profile_fallback_name'),
          }}
        />
        <div className="border-t border-gray-100 pt-5">
          <PublicProfileOverview
            user={previewUser}
            framed={false}
            labels={{
              emptySummary: t('public_empty_summary'),
              bio: t('public_bio'),
              homeLocation: t('public_home_location'),
              professions: t('public_professions'),
              expertise: t('public_expertise'),
              links: t('public_links'),
              liveOnTwitch: t('public_live_on_twitch'),
            }}
          />
        </div>
      </div>}
      </details>
    </Card>
  );
}
