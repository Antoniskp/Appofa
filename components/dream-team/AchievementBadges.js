'use client';

import { useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export const ACHIEVEMENT_BADGES = [
  {
    id: 'first_formation',
    label: 'Πρώτη Σύνθεση',
    emoji: '🎖️',
    description: 'Δημιουργήσατε την πρώτη σας σύνθεση',
    condition: (stats) => stats.formationCount >= 1,
  },
  {
    id: 'five_formations',
    label: 'Ενθουσιώδης',
    emoji: '🔥',
    description: '5 συνθέσεις δημιουργημένες',
    condition: (stats) => stats.formationCount >= 5,
  },
  {
    id: 'ten_formations',
    label: 'Πολυσύνθετος',
    emoji: '💎',
    description: '10 συνθέσεις δημιουργημένες',
    condition: (stats) => stats.formationCount >= 10,
  },
  {
    id: 'full_cabinet',
    label: 'Πλήρες Υπουργικό',
    emoji: '🏛️',
    description: 'Συμπληρώσατε και τις 22 θέσεις',
    condition: (stats) => stats.hasFullCabinet,
  },
  {
    id: 'ten_likes',
    label: 'Αγαπημένος',
    emoji: '❤️‍🔥',
    description: '10 συνολικά likes',
    condition: (stats) => stats.totalLikes >= 10,
  },
  {
    id: 'fifty_likes',
    label: 'Viral',
    emoji: '🚀',
    description: '50 συνολικά likes',
    condition: (stats) => stats.totalLikes >= 50,
  },
  {
    id: 'hundred_likes',
    label: 'Σούπερ Σταρ',
    emoji: '⭐',
    description: '100 συνολικά likes',
    condition: (stats) => stats.totalLikes >= 100,
  },
  {
    id: 'shared',
    label: 'Κοινοποιητής',
    emoji: '📢',
    description: 'Κοινοποιήσατε μία σύνθεση',
    condition: (stats) => stats.hasShared,
  },
  {
    id: 'public_formation',
    label: 'Δημόσιος',
    emoji: '🌍',
    description: 'Δημοσιεύσατε μία δημόσια σύνθεση',
    condition: (stats) => stats.hasPublicFormation,
  },
  {
    id: 'voter',
    label: 'Ψηφοφόρος',
    emoji: '🗳️',
    description: 'Ψηφίσατε σε 5+ θέσεις',
    condition: (stats) => stats.voteCount >= 5,
  },
];

function BadgeCircle({ badge, earned }) {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-1.5 flex-shrink-0">
      <button
        className={`relative h-14 w-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 focus:outline-none ${
          earned
            ? 'bg-white shadow-md shadow-blue-100/60 hover:scale-110 hover:shadow-lg ring-2 ring-blue-200'
            : 'bg-gray-100 opacity-40 cursor-default'
        }`}
        onClick={() => setTooltip((v) => !v)}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        aria-label={`${badge.label}: ${badge.description}`}
        type="button"
      >
        {badge.emoji}
        {!earned && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
            <LockClosedIcon className="h-5 w-5 text-white" />
          </span>
        )}
      </button>
      <span className={`text-[10px] text-center leading-tight max-w-[60px] font-medium ${earned ? 'text-gray-700' : 'text-gray-400'}`}>
        {badge.label}
      </span>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-40 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none text-center">
          <p className="font-semibold mb-0.5">{badge.emoji} {badge.label}</p>
          <p className="text-gray-300 text-[10px] leading-relaxed">{badge.description}</p>
          {!earned && <p className="text-amber-400 text-[10px] mt-1">🔒 Δεν έχει κερδηθεί</p>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * AchievementBadges — horizontal scrollable row of achievement badges.
 *
 * Props:
 *   stats – { formationCount, totalLikes, hasFullCabinet, hasPublicFormation, hasShared, voteCount }
 *           computed from user data
 */
export default function AchievementBadges({ stats = {} }) {
  const earnedCount = ACHIEVEMENT_BADGES.filter((b) => b.condition(stats)).length;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            🎖️ Επιτεύγματα
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {earnedCount}/{ACHIEVEMENT_BADGES.length} badges κερδισμένα
          </p>
        </div>
        {/* Progress bar */}
        <div className="hidden sm:block w-24">
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${(earnedCount / ACHIEVEMENT_BADGES.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-0.5">{Math.round((earnedCount / ACHIEVEMENT_BADGES.length) * 100)}%</p>
        </div>
      </div>

      {/* Scrollable badge row */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
        {ACHIEVEMENT_BADGES.map((badge) => (
          <BadgeCircle
            key={badge.id}
            badge={badge}
            earned={badge.condition(stats)}
          />
        ))}
      </div>
    </div>
  );
}
