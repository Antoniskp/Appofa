'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import positions from '@/config/governmentPositions.json';
import positionTypes from '@/config/governmentPositionTypes.json';
import holders from '@/config/governmentHolders.js';

// Build a lookup map: slug → holder entry
const holderMap = Object.fromEntries(holders.map((h) => [h.slug, h]));

// Build a lookup map: positionTypeKey → type config
const typeMap = Object.fromEntries(positionTypes.map((t) => [t.key, t]));

// Merge positions with their holders — skip positions with no holder data
const positionsWithHolders = positions.positions
  .map((pos) => ({ ...pos, ...holderMap[pos.slug] }))
  .filter((pos) => pos.holder);

export default function GovernmentSnapshotSection() {
  const t = useTranslations('governmentSnapshot');

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
      <div className="app-container py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
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
          {positionsWithHolders.map((pos) => {
            const typeConfig = typeMap[pos.positionTypeKey] || {};
            const badgeColor = typeConfig.color || 'bg-gray-100 text-gray-600';
            return (
              <div
                key={pos.slug}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl" aria-hidden="true">{pos.icon}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                    {typeConfig.labelGr || pos.positionTypeKey}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-snug">{pos.title}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">{pos.holder}</p>
                </div>
                {pos.party && (
                  <p className="text-xs text-gray-400">{pos.party}</p>
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
