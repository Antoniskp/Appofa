'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI';
import { useAsyncData } from '@/hooks/useAsyncData';
import positionTypes from '@/config/governmentPositionTypes.json';
import positionsData from '@/config/governmentPositions.json';

// Build lookup maps at module scope (computed once)
const typeMap = Object.fromEntries(positionTypes.map((t) => [t.key, t]));
const iconMap = positionsData.positions.reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

function HolderAvatar({ photo, name, avatarColor }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || ''}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initial = (name?.trim() || '').charAt(0).toUpperCase() || '?';
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white text-sm"
      style={{ backgroundColor: avatarColor || '#6b7280' }}
      aria-label={name || ''}
    >
      {initial}
    </div>
  );
}

function PositionCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export default function GovernmentSnapshotSection() {
  const t = useTranslations('governmentSnapshot');

  const { data: positionsData, loading } = useAsyncData(
    () => dreamTeamAPI.getPositions('GR'),
    [],
    { transform: (res) => (res?.success ? res.data : []) },
  );

  const positions = positionsData || [];

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
      <div className="app-container py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <Link
            href="/dream-team"
            className="inline-flex items-center gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <span>🗳️</span>
            {t('cta_button')}
          </Link>
        </div>

        {/* Educational disclaimer */}
        <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <span>ℹ️</span>
          {t('disclaimer')}
        </p>

        {/* Position cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <PositionCardSkeleton key={i} />)
            : positions.map((pos) => {
                const typeConfig = typeMap[pos.positionTypeKey] || {};
                const badgeColor = typeConfig.color || 'bg-gray-100 text-gray-600';
                const icon = iconMap[pos.slug] || typeConfig.icon || '⚖️';
                const holder = pos.currentHolders?.[0] || null;
                const holderPhoto = holder?.holderPhoto || holder?.user?.photo || holder?.user?.avatar || null;
                const holderName = holder?.user
                  ? (`${holder.user.firstNameNative || ''} ${holder.user.lastNameNative || ''}`.trim() || holder.user.username)
                  : null;
                const holderAvatarColor = holder?.holderAvatarColor || holder?.user?.avatarColor || null;

                return (
                  <div
                    key={pos.id || pos.slug}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Position type badge + icon */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden="true">{icon}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                        {typeConfig.labelGr || pos.positionTypeKey}
                      </span>
                    </div>

                    {/* Position title */}
                    <p className="text-xs text-gray-500 leading-snug">{pos.title}</p>

                    {/* Current holder */}
                    {holderName ? (
                      <div className="flex items-center gap-3">
                        <HolderAvatar
                          photo={holderPhoto}
                          name={holderName}
                          avatarColor={holderAvatarColor}
                        />
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{holderName}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">{t('no_holder')}</p>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Bottom CTA row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            {t('dream_team_prompt')}
          </p>
          <Link
            href="/dream-team"
            className="inline-flex items-center gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <span>🗳️</span>
            {t('cta_button')}
          </Link>
        </div>
      </div>
    </section>
  );
}
