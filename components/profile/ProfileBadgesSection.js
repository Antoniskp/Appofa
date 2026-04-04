'use client';

import { useState } from 'react';
import Link from 'next/link';

const BADGE_TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇' };

function BadgeTierImage({ slug, tier, size = 'w-6 h-6' }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <span className="text-base">{BADGE_TIER_EMOJI[tier] || '🏅'}</span>;
  }
  return (
    <img
      src={`/images/badges/${slug}-${tier}.svg`}
      alt={`${slug} ${tier}`}
      className={`${size} object-contain`}
      onError={() => setImgError(true)}
    />
  );
}

function getEarnedBadges(progress) {
  if (!progress) return [];
  return progress.flatMap(b =>
    b.tiers.filter(t => t.earned).map(t => ({ slug: b.slug, tier: t.tier, name: b.name, label: t.label }))
  );
}

/**
 * Badges section: displays badge progress and allows selecting a display badge.
 *
 * @param {Object} props
 * @param {Array|null} props.badgeProgress
 * @param {boolean} props.badgeEvaluating
 * @param {{ slug: string|null, tier: string|null }} props.displayBadge
 * @param {boolean} props.savingDisplayBadge
 * @param {Function} props.onEvaluate
 * @param {Function} props.onSelectDisplayBadge - (slug, tier) => void
 * @param {Function} props.onClearDisplayBadge - () => void
 */
export default function ProfileBadgesSection({
  badgeProgress,
  badgeEvaluating,
  displayBadge,
  savingDisplayBadge,
  onEvaluate,
  onSelectDisplayBadge,
  onClearDisplayBadge,
}) {
  const isSelected = (slug, tier) => displayBadge.slug === slug && displayBadge.tier === tier;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Τα Badges μου</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEvaluate}
            disabled={badgeEvaluating}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {badgeEvaluating ? 'Αξιολόγηση...' : 'Αξιολόγηση τώρα'}
          </button>
          <Link href="/platform/badges" className="text-xs text-blue-600 hover:underline">
            Πληροφορίες →
          </Link>
        </div>
      </div>
      {badgeProgress === null ? (
        <p className="text-sm text-gray-500">Φόρτωση badges...</p>
      ) : (
        <div className="space-y-6">
          {(() => {
            const allEarned = getEarnedBadges(badgeProgress);
            if (allEarned.length === 0) return null;
            return (
              <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Εμφάνιση στο avatar</p>
                <p className="text-xs text-gray-500 mb-3">Επίλεξε ποιο badge να εμφανίζεται στο avatar σου.</p>
                <div className="flex flex-wrap gap-2">
                  {allEarned.map(({ slug, tier, name, label }) => (
                    <button
                      key={`${slug}:${tier}`}
                      type="button"
                      disabled={savingDisplayBadge}
                      onClick={() => isSelected(slug, tier) ? onClearDisplayBadge() : onSelectDisplayBadge(slug, tier)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition ${
                        isSelected(slug, tier)
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                      } disabled:opacity-50`}
                      title={isSelected(slug, tier) ? 'Κλικ για αφαίρεση' : 'Επιλογή για avatar'}
                    >
                      <BadgeTierImage slug={slug} tier={tier} size="w-4 h-4" />
                      <span>{name} · {label || tier}</span>
                      {isSelected(slug, tier) && <span className="ml-0.5">✓</span>}
                    </button>
                  ))}
                  {displayBadge.slug && (
                    <button
                      type="button"
                      disabled={savingDisplayBadge}
                      onClick={onClearDisplayBadge}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-red-200 text-xs text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      ✕ Καθαρισμός επιλογής
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {Object.entries(
            badgeProgress.reduce((acc, badge) => {
              const cat = badge.category || 'other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(badge);
              return acc;
            }, {})
          ).map(([category, categoryBadges]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryBadges.map((badge) => (
                  <div key={badge.slug} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">{badge.name}</p>
                    <div className="space-y-1.5">
                      {badge.tiers.map((t) => (
                        <div key={t.tier} className={`flex items-center gap-2 ${t.earned ? '' : 'opacity-60'}`}>
                          <BadgeTierImage slug={badge.slug} tier={t.tier} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-700 capitalize">{t.label || t.tier}</span>
                              {t.earned ? (
                                <span className="text-xs text-green-600 font-medium" aria-label="Κερδηθηκε">
                                  ✓ {t.earnedAt ? new Date(t.earnedAt).toLocaleDateString('el-GR') : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">{t.progress}%</span>
                              )}
                            </div>
                            {!t.earned && (
                              <div className="mt-0.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 rounded-full"
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
