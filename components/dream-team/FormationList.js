'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import FormationCard from './FormationCard';
import FormationBuilder from './FormationBuilder';
import SkeletonPositionCard from './SkeletonPositionCard';
import UserStatsDashboard from './UserStatsDashboard';
import AchievementBadges from './AchievementBadges';

/** Identifies a formation as the Primary Formation.
 * Checks `isPrimary` flag first (requires backend support).
 * Falls back to name+category match as a temporary compatibility measure
 * until the backend persists the `isPrimary` field.
 * TODO: Remove the name/category fallback once backend migration is deployed.
 */
function isPrimaryFormation(f) {
  return f?.isPrimary === true || (f?.name === 'Η Κυβέρνησή μου' && f?.category === 'serious');
}

/**
 * FormationList — manages the list/builder flow for a user's formations.
 *
 * Props:
 *   user             – current user object (from useAuth)
 *   communityResults – array of community results (for quick-fill in builder)
 *   showToast(msg, type) – show a notification
 *   onCompare(formation) – open comparison tool with this formation pre-selected
 *   positions        – positions array with id+slug (from getPositions API)
 *   myVotes          – array of the user's current votes (from getMyVotes API)
 *   onVotesChanged() – callback to refresh votes in the parent after formation→votes sync
 */
export default function FormationList({ user, communityResults = [], showToast, onCompare, positions = [], myVotes = [], onVotesChanged }) {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'builder'
  const [editingFormation, setEditingFormation] = useState(null);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  const loadFormations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dreamTeamAPI.getMyFormations();
      if (res?.success) {
        const list = res.data || [];
        // Auto-create primary formation if none exists
        if (list.length === 0 || !list.some(isPrimaryFormation)) {
          try {
            const created = await dreamTeamAPI.createFormation({
              name: 'Η Κυβέρνησή μου',
              category: 'serious',
              isPublic: false,
              isPrimary: true,
            });
            if (created?.success && created.data) {
              // Merge `isPrimary: true` client-side since the backend may not
              // return it yet. Once the backend migration is deployed this
              // merge can be removed and `created.data` used directly.
              setFormations([{ ...created.data, isPrimary: true }, ...list]);
            } else {
              setFormations(list);
            }
          } catch {
            setFormations(list);
          }
        } else {
          setFormations(list);
        }
      }
    } catch {
      // Non-critical — keep empty list
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await dreamTeamAPI.getUserStats();
      if (res?.success) setStats(res.data || {});
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFormations();
      loadStats();
    }
  }, [user, loadFormations, loadStats]);

  const handleNewFormation = () => {
    setEditingFormation(null);
    setView('builder');
  };

  const handleEdit = (formation) => {
    setEditingFormation(formation);
    setView('builder');
  };

  const handleSave = (savedFormation) => {
    setFormations((prev) => {
      const idx = prev.findIndex((f) => f.id === savedFormation.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedFormation;
        return updated;
      }
      return [savedFormation, ...prev];
    });
    setView('list');
    setEditingFormation(null);
    // Refresh stats after save
    loadStats();
  };

  const handleBack = () => {
    setView('list');
    setEditingFormation(null);
  };

  const handleDelete = useCallback(async (id) => {
    try {
      const res = await dreamTeamAPI.deleteFormation(id);
      if (res?.success) {
        setFormations((prev) => prev.filter((f) => f.id !== id));
        showToast('Η σύνθεση διαγράφηκε.');
        loadStats();
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά τη διαγραφή', 'error');
    }
  }, [showToast, loadStats]);

  const handleLike = useCallback(async (id) => {
    try {
      const res = await dreamTeamAPI.likeFormation(id);
      if (res?.success) {
        setFormations((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, likedByMe: res.data?.likedByMe, likeCount: res.data?.likeCount ?? f.likeCount }
              : f,
          ),
        );
      }
    } catch {
      // Non-critical
    }
  }, []);

  const handleShareCopy = useCallback((formation) => {
    const url = `${window.location.origin}/dream-team/f/${formation.shareSlug || formation.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Ο σύνδεσμος αντιγράφηκε!');
    }).catch(() => {
      showToast('Αδυναμία αντιγραφής συνδέσμου', 'error');
    });
  }, [showToast]);

  // ── Builder view ────────────────────────────────────────────────────────────
  if (view === 'builder') {
    const isPrimary = editingFormation ? isPrimaryFormation(editingFormation) : false;
    return (
      <FormationBuilder
        formation={editingFormation}
        communityResults={communityResults}
        onSave={handleSave}
        onBack={handleBack}
        showToast={showToast}
        isPrimary={isPrimary}
        positions={isPrimary ? positions : undefined}
        myVotes={isPrimary ? myVotes : undefined}
        onVotesChanged={isPrimary ? onVotesChanged : undefined}
      />
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const primaryFormation = formations.find(isPrimaryFormation) || null;
  const otherFormations = formations.filter((f) => !isPrimaryFormation(f));

  // ── Primary Formation card props helpers ─────────────────────────────────────
  const primaryFilledCount = primaryFormation
    ? (primaryFormation.picks || []).filter((p) => p.personId || p.candidateUserId || p.personName).length
    : 0;
  const TOTAL_POSITIONS = 22;

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Οι Συνθέσεις μου</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Δημιουργήστε τις δικές σας ιδανικές κυβερνήσεις
          </p>
        </div>
        <button
          onClick={handleNewFormation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Νέα Σύνθεση
        </button>
      </div>

      {/* Stats Dashboard */}
      <UserStatsDashboard stats={stats} loading={statsLoading} />

      {/* Achievement Badges */}
      <AchievementBadges stats={stats} />

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <SkeletonPositionCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Primary Formation — pinned special card */}
          {primaryFormation && (
            <div className="mb-2">
              <div className="relative rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-md p-5 flex flex-col gap-4">
                {/* Shield badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ShieldCheckIcon className="h-6 w-6 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">{primaryFormation.name}</h3>
                      <p className="text-xs text-indigo-500 mt-0.5 font-medium">
                        Αυτή είναι η πραγματική σας επιλογή. Συγχρονίζεται με τις ψήφους σας.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                    🛡️ Ιδιωτική
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{primaryFilledCount}/{TOTAL_POSITIONS} θέσεις</span>
                    <span className="text-xs text-gray-400">{Math.round((primaryFilledCount / TOTAL_POSITIONS) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(primaryFilledCount / TOTAL_POSITIONS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Edit button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleEdit(primaryFormation)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    ✏️ Επεξεργασία
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Formations */}
          <div>
            {otherFormations.length > 0 && (
              <h3 className="text-sm font-semibold text-gray-500 mb-3">📋 Οι Υπόλοιπες Συνθέσεις μου</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* "New" creation card */}
              <button
                onClick={handleNewFormation}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors group min-h-[160px]"
              >
                <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <PlusIcon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">+ Νέα Σύνθεση</p>
              </button>

              {otherFormations.map((formation) => (
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  isPrimary={false}
                  isOwner
                  onEdit={() => handleEdit(formation)}
                  onDelete={() => handleDelete(formation.id)}
                  onLike={() => handleLike(formation.id)}
                  onCompare={onCompare ? () => onCompare(formation) : undefined}
                  onShareCopy={() => handleShareCopy(formation)}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
