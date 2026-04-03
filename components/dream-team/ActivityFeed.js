'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';

const REFRESH_INTERVAL_MS = 60000;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'μόλις τώρα';
  if (diff < 3600) return `πριν ${Math.floor(diff / 60)} λεπτά`;
  if (diff < 86400) return `πριν ${Math.floor(diff / 3600)} ώρες`;
  if (diff < 604800) return `πριν ${Math.floor(diff / 86400)} μέρες`;
  return new Date(dateStr).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
}

function SkeletonItem() {
  return (
    <div className="flex items-start gap-3 py-3 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-1.5" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

/**
 * ActivityFeed — collapsible timeline of recent public formation activity.
 * Shown in the Explore tab.
 *
 * Props: none (fetches its own data)
 */
export default function ActivityFeed() {
  const [expanded, setExpanded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadFeed = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await dreamTeamAPI.getActivityFeed({ limit: 15 });
      if (res?.success) setActivities(res.data || []);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  const handleToggle = () => {
    setExpanded((v) => {
      const next = !v;
      if (next && !loaded) loadFeed();
      return next;
    });
  };

  // Auto-refresh every 60 seconds when expanded
  useEffect(() => {
    if (!expanded) return;
    const interval = setInterval(() => {
      setLoaded(false);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [expanded]);

  useEffect(() => {
    if (expanded && !loaded) loadFeed();
  }, [expanded, loaded, loadFeed]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 rounded-2xl transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-bold text-gray-900 flex items-center gap-2">
          📰 Πρόσφατη Δραστηριότητα
          {!expanded && (
            <span className="text-xs font-normal text-gray-400 hidden sm:inline">Κάντε κλικ για προβολή</span>
          )}
        </span>
        {expanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" aria-hidden="true" />

            <div className="space-y-1">
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonItem key={i} />)
                : activities.length === 0
                  ? (
                    <p className="text-center text-sm text-gray-400 py-6 ml-8">
                      Δεν υπάρχει πρόσφατη δραστηριότητα.
                    </p>
                  )
                  : activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2.5 relative">
                      {/* Dot / Avatar */}
                      <div className="flex-shrink-0 relative z-10">
                        {activity.authorAvatar ? (
                          <img
                            src={activity.authorAvatar}
                            alt={activity.authorName}
                            className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserCircleIcon className="h-5 w-5 text-blue-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {activity.emoji}{' '}
                          <span className="font-semibold">{activity.authorName}</span>
                          {' '}δημιούργησε τη σύνθεση{' '}
                          <span className="font-medium text-gray-800">«{activity.formationName}»</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{timeAgo(activity.timestamp)}</span>
                          {activity.formationSlug && (
                            <a
                              href={`/dream-team/f/${activity.formationSlug}`}
                              className="text-xs text-blue-500 hover:underline"
                            >
                              Προβολή →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
