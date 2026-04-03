'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';

const POSITION_LABELS = {
  'prothypoyrgos': 'Πρωθυπουργός',
  'proedros-dimokratias': 'Πρόεδρος Δημοκρατίας',
  'proedros-voulis': 'Πρόεδρος Βουλής',
};

/**
 * PopularPicks — shows the most picked persons per top position across public formations.
 */
export default function PopularPicks() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await dreamTeamAPI.getPopularPicks();
        if (res?.success) {
          setPicks(res.data || []);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Don't render if all have 0 count
  const hasData = picks.some((p) => p.count > 0);
  if (!loading && !hasData) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>📊</span> Δημοφιλείς Επιλογές στις Κορυφαίες Θέσεις
      </h3>

      {loading ? (
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 animate-pulse">
              <div className="h-3 bg-gray-100 rounded mb-2 w-2/3" />
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded mb-1" />
                  <div className="h-2 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {picks.map((pick) => (
            <div key={pick.positionSlug} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {pick.photo || pick.avatar ? (
                <img
                  src={pick.photo || pick.avatar}
                  alt={pick.personName || ''}
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                  <UserCircleIcon className="h-6 w-6 text-blue-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{POSITION_LABELS[pick.positionSlug] || pick.positionSlug}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {pick.personName || '—'}
                </p>
                {pick.count > 0 && (
                  <p className="text-xs text-blue-600 font-medium">
                    σε {pick.count} {pick.count === 1 ? 'σύνθεση' : 'συνθέσεις'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
