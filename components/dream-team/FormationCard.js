'use client';

import { useState } from 'react';
import { UserCircleIcon, PencilIcon, TrashIcon, ShareIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export const FORMATION_CATEGORIES = [
  { id: 'serious', label: 'Σοβαρή', emoji: '🎯', color: 'bg-blue-100 text-blue-700' },
  { id: 'fun', label: 'Αστεία', emoji: '😂', color: 'bg-amber-100 text-amber-700' },
  { id: 'custom', label: 'Προσαρμοσμένη', emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
];

const TOTAL_POSITIONS = 22;

/**
 * FormationCard — preview card for a single formation.
 *
 * Props:
 *   formation  – formation object
 *   onEdit     – () => void
 *   onDelete   – () => void
 *   onLike     – () => void
 *   onShareCopy – () => void  (called when share button is clicked; parent handles clipboard)
 *   isOwner    – whether the current user owns this formation
 */
export default function FormationCard({ formation, onEdit, onDelete, onLike, onShareCopy, isOwner = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = FORMATION_CATEGORIES.find((c) => c.id === formation.category) || FORMATION_CATEGORIES[2];
  const picks = formation.picks || [];
  const filledCount = picks.filter((p) => p.personId || p.candidateUserId || p.personName).length;

  // Top 3 preview: PM, President, Speaker (by positionTypeKey)
  const topSlugs = ['prothypoyrgos', 'proedros-dimokratias', 'proedros-voulis'];
  const topPicks = topSlugs
    .map((slug) => picks.find((p) => p.positionSlug === slug || p.slug === slug))
    .filter(Boolean);

  const handleShareClick = () => {
    if (onShareCopy) onShareCopy();
  };

  const formattedDate = formation.updatedAt
    ? new Date(formation.updatedAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate">{formation.name}</h3>
          {formation.authorName && (
            <p className="text-xs text-gray-400 mt-0.5">από {formation.authorName}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${category.color}`}>
          {category.emoji} {category.label}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{filledCount}/{TOTAL_POSITIONS} θέσεις</span>
          <span className="text-xs text-gray-400">{Math.round((filledCount / TOTAL_POSITIONS) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(filledCount / TOTAL_POSITIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* Top 3 picks preview */}
      {topPicks.length > 0 && (
        <div className="flex gap-2">
          {topPicks.map((pick, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              {pick.photo || pick.avatar ? (
                <img
                  src={pick.photo || pick.avatar}
                  alt={pick.personName || ''}
                  className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <p className="text-xs text-gray-600 text-center truncate w-full">{pick.personName || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        {/* Like */}
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Μου αρέσει"
        >
          {formation.likedByMe
            ? <HeartSolid className="h-4 w-4 text-red-500" />
            : <HeartIcon className="h-4 w-4" />}
          <span>{formation.likeCount || 0}</span>
        </button>

        {formattedDate && (
          <span className="text-xs text-gray-300">{formattedDate}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {(formation.shareSlug || formation.id) && (
            <button
              onClick={handleShareClick}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Αντιγραφή συνδέσμου"
              title="Αντιγραφή συνδέσμου"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
          {isOwner && onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Επεξεργασία"
              title="Επεξεργασία"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {isOwner && onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false); }}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Διαγραφή;
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Άκυρο
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Διαγραφή"
                title="Διαγραφή"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
