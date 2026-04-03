'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';

const MEDALS = ['🥇', '🥈', '🥉'];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="h-6 w-6 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
    </div>
  );
}

/**
 * Leaderboard — collapsible top-10 users by total likes.
 * Shown in the Explore tab below PopularPicks.
 *
 * Props:
 *   currentUserId – id of the logged-in user (to highlight their row)
 */
export default function Leaderboard({ currentUserId }) {
  const [expanded, setExpanded] = useState(true);
  const [entries, setEntries] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const loadData = useCallback(async (reset = true) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await dreamTeamAPI.getLeaderboard({ limit: LIMIT, offset: currentOffset });
      if (res?.success) {
        if (reset) {
          setEntries(res.data || []);
        } else {
          setEntries((prev) => [...prev, ...(res.data || [])]);
        }
        setHasMore(res.hasMore || false);
        setCurrentUserRank(res.currentUserRank || null);
        setOffset(currentOffset + LIMIT);
      }
    } catch {
      // Non-critical
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    loadData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 rounded-2xl transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-bold text-gray-900 flex items-center gap-2">
          🏆 Κατάταξη Χρηστών
          {!loading && entries.length > 0 && (
            <span className="text-xs font-normal text-gray-400">Top {entries.length}</span>
          )}
        </span>
        {expanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 pb-5">
          <div className="divide-y divide-gray-50">
            {loading
              ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              : entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 py-3 rounded-xl transition-colors ${
                      entry.isCurrentUser ? 'bg-blue-50 -mx-2 px-2' : ''
                    }`}
                  >
                    {/* Rank */}
                    <span className="text-lg w-7 text-center flex-shrink-0 font-bold text-gray-400">
                      {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                    </span>

                    {/* Avatar */}
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.username} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                        <UserCircleIcon className="h-5 w-5 text-blue-400" />
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                        {entry.username}
                        {entry.isCurrentUser && <span className="ml-1.5 text-xs font-normal text-blue-500">(Εσείς)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{entry.publicFormations} δημόσιες συνθέσεις</p>
                    </div>

                    {/* Likes */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-500">{entry.totalLikes.toLocaleString('el-GR')}</p>
                      <p className="text-[10px] text-gray-400">likes</p>
                    </div>
                  </div>
                ))}
          </div>

          {/* Load more */}
          {hasMore && !loading && (
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={loadingMore}
              className="mt-3 w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Φόρτωση...' : 'Εμφάνιση περισσότερων'}
            </button>
          )}

          {/* Current user rank if not in list */}
          {currentUserRank && !loading && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Η κατάταξή σας:</span>
              <span className="font-bold text-blue-600">
                #{currentUserRank.rank}
                <span className="font-normal text-gray-400 ml-2">({currentUserRank.totalLikes} likes)</span>
              </span>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Δεν υπάρχουν δεδομένα κατάταξης ακόμα.</p>
          )}
        </div>
      )}
    </div>
  );
}
