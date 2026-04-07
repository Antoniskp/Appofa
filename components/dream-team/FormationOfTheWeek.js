'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';

const TOP_SLUGS = ['prothypoyrgos', 'proedros-dimokratias', 'proedros-voulis'];

function Skeleton() {
  return (
    <div className="rounded-2xl p-0.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 mb-6 animate-pulse">
      <div className="bg-white rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-40 bg-gray-200 rounded-full" />
        </div>
        <div className="h-7 w-2/3 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-1/3 bg-gray-100 rounded-lg mb-4" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="h-14 w-14 rounded-full bg-gray-200" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * FormationOfTheWeek — Featured card showing the top-liked public formation
 * from the past 7 days. Sits above PopularPicks in the Explore tab.
 *
 * Props:
 *   onLike(id)   – like handler
 *   onCompare(f) – compare handler (opens comparison tool)
 *   showToast    – toast function
 */
export default function FormationOfTheWeek({ onLike, onCompare, showToast }) {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dreamTeamAPI.getFormationOfTheWeek()
      .then((res) => { if (mounted && res?.success) setFormation(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Skeleton />;
  if (!formation) return null;

  const picks = formation.picks || [];
  const topPicks = TOP_SLUGS
    .map((slug) => picks.find((p) => p.positionSlug === slug))
    .filter(Boolean);
  const filledCount = picks.filter((p) => p.candidateUserId || p.personName).length;

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) onLike(formation.id);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    if (onCompare) onCompare(formation);
  };

  return (
    <div className="mb-6">
      {/* Golden gradient border wrapper */}
      <div className="rounded-2xl p-0.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shadow-lg shadow-amber-200/50 relative">
        {/* Shimmer glow animation */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ backgroundSize: '200% 100%' }}
          aria-hidden="true"
        />
        <div className="bg-white rounded-[14px] p-6 relative">
          {/* Badge */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-sm">
              🏆 Σύνθεση της Εβδομάδας
            </span>
            <span className="text-xs text-gray-400 italic">Η πιο αγαπημένη σύνθεση της εβδομάδας</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-extrabold text-gray-900 truncate mb-1">{formation.name}</h3>

              {/* Author */}
              {formation.authorName && (
                <div className="flex items-center gap-1.5 mb-3">
                  {formation.authorAvatar ? (
                    <img src={formation.authorAvatar} alt={formation.authorName} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCircleIcon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  )}
                  <span className="text-sm text-gray-500">από <span className="font-medium text-gray-700">{formation.authorName}</span></span>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  {formation.likedByMe
                    ? <HeartSolid className="h-4 w-4 text-red-500" />
                    : <HeartIcon className="h-4 w-4" />}
                  <span className="font-semibold text-gray-700">{formation.likeCount || 0}</span> likes
                </span>
                <span>
                  🏛️ <span className="font-semibold text-gray-700">{filledCount}</span>/22 θέσεις
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {formation.shareSlug && (
                  <a
                    href={`/dream-team/f/${formation.shareSlug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    👁️ Προβολή
                  </a>
                )}
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    formation.likedByMe
                      ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                  }`}
                  aria-label={formation.likedByMe ? 'Αφαίρεση like' : 'Μου αρέσει'}
                >
                  {formation.likedByMe ? <HeartSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                  {formation.likedByMe ? 'Αρέσει' : 'Μου αρέσει'}
                </button>
                {onCompare && (
                  <button
                    onClick={handleCompare}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    ⚖️ Σύγκριση
                  </button>
                )}
              </div>
            </div>

            {/* Top 3 picks */}
            {topPicks.length > 0 && (
              <div className="flex gap-4 sm:justify-end items-start">
                {topPicks.map((pick, idx) => {
                  const labels = ['Πρωθυπουργός', 'Πρόεδρος', 'Πρόεδρος Βουλής'];
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-20">
                      {pick.photo || pick.avatar ? (
                        <img
                          src={pick.photo || pick.avatar}
                          alt={pick.personName || ''}
                          className="h-14 w-14 rounded-full object-cover border-2 border-amber-300 shadow-md"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-amber-300">
                          <UserCircleIcon className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                      <p className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">{pick.personName || '—'}</p>
                      <p className="text-[10px] text-gray-400 text-center">{labels[idx]}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
