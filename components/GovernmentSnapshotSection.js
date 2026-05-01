'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI';
import { useAsyncData } from '@/hooks/useAsyncData';
import positionTypes from '@/config/governmentPositionTypes.json';
import positionsConfig from '@/config/governmentPositions.json';

const MAX_PREVIEW = 6;

// Build lookup maps at module scope (computed once)
const typeMap = Object.fromEntries(positionTypes.map((t) => [t.key, t]));
const iconMap = positionsConfig.positions.reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

function SmallAvatar({ photo, name, avatarColor, indigo = false }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || ''}
        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initial = (name?.trim() || '').charAt(0).toUpperCase() || '?';
  const bg = indigo ? '#6366f1' : (avatarColor || '#6b7280');
  return (
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white text-xs"
      style={{ backgroundColor: bg }}
      aria-label={name || ''}
    >
      {initial}
    </div>
  );
}

function PositionCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="border-t border-gray-100 pt-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 bg-gray-200 rounded w-14 shrink-0" />
          <div className="h-7 w-7 bg-gray-200 rounded-full shrink-0" />
          <div className="h-3 bg-gray-200 rounded flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-indigo-100 rounded w-14 shrink-0" />
          <div className="h-7 w-7 bg-indigo-100 rounded-full shrink-0" />
          <div className="h-3 bg-indigo-100 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

export default function GovernmentSnapshotSection() {
  const t = useTranslations('governmentSnapshot');

  const { data: combined, loading } = useAsyncData(
    async () => {
      const [posRes, resRes] = await Promise.all([
        dreamTeamAPI.getPositions('GR'),
        dreamTeamAPI.getResults('GR'),
      ]);
      const positions = posRes?.success ? posRes.data : [];
      const resultsMap = (resRes?.success ? resRes.data : []).reduce((acc, item) => {
        if (item.position?.id) acc[item.position.id] = item.winner;
        return acc;
      }, {});
      return { positions, resultsMap };
    },
    [],
  );

  const positions = useMemo(
    () => (combined?.positions || []).slice(0, MAX_PREVIEW),
    [combined],
  );
  const resultsMap = combined?.resultsMap || {};

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
      <div className="app-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('subtitle')}</p>
          </div>
          <Link
            href="/dream-team"
            className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {t('cta_view_all')} →
          </Link>
        </div>

        {/* Position cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: MAX_PREVIEW }).map((_, i) => <PositionCardSkeleton key={i} />)
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

                const winner = resultsMap[pos.id] || null;

                return (
                  <div
                    key={pos.id || pos.slug}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Position type badge + icon */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden="true">{icon}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                        {typeConfig.labelGr || pos.positionTypeKey}
                      </span>
                    </div>

                    {/* Position title */}
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{pos.title}</p>

                    {/* Comparison rows */}
                    <div className="border-t border-gray-100 pt-2 space-y-2">
                      {/* Today row */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 shrink-0 w-20">{t('today')}:</span>
                        {holderName ? (
                          <>
                            <SmallAvatar photo={holderPhoto} name={holderName} avatarColor={holderAvatarColor} />
                            <span className="text-xs font-medium text-gray-700 truncate">{holderName}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{t('no_holder')}</span>
                        )}
                      </div>

                      {/* Community row */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-indigo-500 shrink-0 w-20">{t('community')}:</span>
                        {winner ? (
                          <>
                            <SmallAvatar photo={winner.avatar} name={winner.personName} indigo />
                            <span className="text-xs font-medium text-indigo-700 truncate">{winner.personName}</span>
                            <span className="ml-auto text-xs text-gray-400 shrink-0 tabular-nums">
                              {winner.voteCount} {t('votes_suffix')}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{t('no_votes')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
