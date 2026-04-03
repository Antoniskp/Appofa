'use client';

import { ACHIEVEMENT_BADGES } from './AchievementBadges';

const STAT_CARDS = [
  {
    id: 'formations',
    emoji: '📋',
    label: 'Συνθέσεις',
    getValue: (stats) => stats.formationCount ?? 0,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    id: 'likes',
    emoji: '❤️',
    label: 'Likes',
    getValue: (stats) => stats.totalLikes ?? 0,
    color: 'from-red-400 to-pink-500',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  {
    id: 'completion',
    emoji: '🏛️',
    label: 'Πληρότητα',
    getValue: (stats) => `${stats.avgCompletion ?? 0}%`,
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  {
    id: 'rank',
    emoji: '🏆',
    label: 'Κατάταξη',
    getValue: (stats) => stats.rank !== null && stats.rank !== undefined ? `#${stats.rank}` : '—',
    color: 'from-amber-400 to-yellow-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  {
    id: 'badges',
    emoji: '🎖️',
    label: 'Badges',
    getValue: (stats) => {
      const earned = ACHIEVEMENT_BADGES.filter((b) => b.condition(stats)).length;
      return `${earned}/${ACHIEVEMENT_BADGES.length}`;
    },
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
];

/**
 * UserStatsDashboard — compact stats grid shown at the top of "Οι Συνθέσεις μου".
 *
 * Props:
 *   stats – stats object (from API or computed from formations)
 *   loading – whether stats are loading
 */
export default function UserStatsDashboard({ stats = {}, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
            <div className="h-6 w-6 bg-gray-200 rounded-full mb-2" />
            <div className="h-5 w-12 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {STAT_CARDS.map((card) => (
        <div
          key={card.id}
          className={`${card.bg} rounded-2xl border border-white/60 p-4 flex flex-col gap-1 hover:shadow-md transition-shadow`}
        >
          <span className="text-xl" aria-hidden="true">{card.emoji}</span>
          <span className={`text-xl font-extrabold ${card.text}`}>{card.getValue(stats)}</span>
          <span className="text-xs text-gray-500 font-medium">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
