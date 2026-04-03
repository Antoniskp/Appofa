'use client';

import { useState } from 'react';
import { UserCircleIcon, ArrowLeftIcon, ShareIcon, HeartIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import positionsData from '@/config/governmentPositions.json';
import ShareModal from './ShareModal';

const FORMATION_CATEGORIES = [
  { id: 'serious', label: 'Σοβαρή', emoji: '🎯', color: 'bg-blue-100 text-blue-700' },
  { id: 'fun', label: 'Αστεία', emoji: '😂', color: 'bg-amber-100 text-amber-700' },
  { id: 'custom', label: 'Προσαρμοσμένη', emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
];

const ALL_POSITIONS = positionsData.positions;
const TOP_POSITIONS = ALL_POSITIONS.filter((p) => p.positionTypeKey !== 'minister');
const MINISTER_POSITIONS = ALL_POSITIONS.filter((p) => p.positionTypeKey === 'minister');

function PickCard({ position, pick }) {
  const hasPick = !!(pick && (pick.personId || pick.candidateUserId || pick.personName));
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 text-lg">
        {position.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{position.title}</p>
        {hasPick ? (
          <div className="flex items-center gap-2 mt-0.5">
            {(pick.photo || pick.avatar) ? (
              <img
                src={pick.photo || pick.avatar}
                alt={pick.personName}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircleIcon className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <p className="font-semibold text-sm text-gray-800 truncate">{pick.personName}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-300 italic mt-0.5">—</p>
        )}
      </div>
    </div>
  );
}

/**
 * FormationView — read-only view of a formation (for sharing).
 *
 * Props:
 *   formation  – formation object with picks array
 *   onBack()   – navigate back (optional, not shown on standalone page)
 *   showToast  – optional toast function
 *   onLike()   – optional like handler (for logged-in users)
 *   onCompare() – optional compare handler
 *   isOwner    – whether the current user owns this formation
 */
export default function FormationView({ formation, onBack, showToast, onLike, onCompare, isOwner }) {
  const [shareOpen, setShareOpen] = useState(false);

  if (!formation) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-4xl mb-4 block">🏛️</span>
        <p className="text-lg font-medium">Η σύνθεση δεν βρέθηκε</p>
      </div>
    );
  }

  const category = FORMATION_CATEGORIES.find((c) => c.id === formation.category) || FORMATION_CATEGORIES[2];
  const picks = formation.picks || [];
  const picksMap = {};
  picks.forEach((p) => {
    picksMap[p.positionSlug || p.slug] = p;
  });
  const filledCount = picks.filter((p) => p.personId || p.candidateUserId || p.personName).length;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Πίσω
        </button>
      )}

      {/* Formation header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{formation.name}</h1>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${category.color}`}>
                {category.emoji} {category.label}
              </span>
            </div>

            {/* Author */}
            {formation.authorName && (
              <div className="flex items-center gap-2 mt-1">
                {formation.authorAvatar ? (
                  <img
                    src={formation.authorAvatar}
                    alt={formation.authorName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircleIcon className="h-4 w-4 text-blue-400" />
                  </div>
                )}
                <p className="text-sm text-gray-500">από <span className="font-medium text-gray-700">{formation.authorName}</span></p>
              </div>
            )}

            {formation.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{formation.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Like button — shown to non-owners if onLike provided */}
            {onLike && !isOwner && (
              <button
                onClick={onLike}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-xl text-sm font-medium transition-colors"
                aria-label={formation.likedByMe ? 'Αφαίρεση like' : 'Μου αρέσει'}
              >
                {formation.likedByMe
                  ? <HeartSolid className="h-4 w-4 text-red-500" />
                  : <HeartIcon className="h-4 w-4" />}
                <span>{formation.likeCount || 0}</span>
              </button>
            )}

            {/* Share button */}
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
              Κοινοποίηση
            </button>

            {/* Compare button */}
            {onCompare && (
              <button
                onClick={onCompare}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                Σύγκριση
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">{filledCount}/{ALL_POSITIONS.length} θέσεις</span>
            <span className="text-xs text-gray-400">{Math.round((filledCount / ALL_POSITIONS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(filledCount / ALL_POSITIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {/* Top positions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🏛️</span> Ανώτατες Θέσεις
          </h2>
          <div className="divide-y divide-gray-50">
            {TOP_POSITIONS.map((position) => (
              <PickCard key={position.slug} position={position} pick={picksMap[position.slug]} />
            ))}
          </div>
        </div>

        {/* Ministers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚖️</span> Υπουργικό Συμβούλιο
          </h2>
          <div className="divide-y divide-gray-50">
            {MINISTER_POSITIONS.map((position) => (
              <PickCard key={position.slug} position={position} pick={picksMap[position.slug]} />
            ))}
          </div>
        </div>
      </div>

      {/* Create your own CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 text-center">
        <p className="text-lg font-bold text-gray-800 mb-1">Φτιάξτε τη δική σας σύνθεση!</p>
        <p className="text-sm text-gray-500 mb-4">Επιλέξτε ποιοι θα κυβερνούν στην ονειρεμένη σας κυβέρνηση.</p>
        <a
          href="/dream-team"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          🏛️ Δημιουργήστε τη δική σας σύνθεση →
        </a>
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <ShareModal
          formation={formation}
          onClose={() => setShareOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
