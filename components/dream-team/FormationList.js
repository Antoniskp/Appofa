'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import FormationCard from './FormationCard';
import FormationBuilder from './FormationBuilder';
import SkeletonPositionCard from './SkeletonPositionCard';

/**
 * FormationList — manages the list/builder flow for a user's formations.
 *
 * Props:
 *   user             – current user object (from useAuth)
 *   communityResults – array of community results (for quick-fill in builder)
 *   showToast(msg, type) – show a notification
 */
export default function FormationList({ user, communityResults = [], showToast }) {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'builder'
  const [editingFormation, setEditingFormation] = useState(null);

  const loadFormations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dreamTeamAPI.getMyFormations();
      if (res?.success) {
        setFormations(res.data || []);
      }
    } catch {
      // Non-critical — keep empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFormations();
  }, [user, loadFormations]);

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
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά τη διαγραφή', 'error');
    }
  }, [showToast]);

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
    return (
      <FormationBuilder
        formation={editingFormation}
        communityResults={communityResults}
        onSave={handleSave}
        onBack={handleBack}
        showToast={showToast}
      />
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Οι Συνθέσεις μου</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Δημιουργήστε τις δικές σας ονειρεμένες κυβερνήσεις
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

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <SkeletonPositionCard key={i} />)}
        </div>
      ) : formations.length === 0 ? (
        /* Empty state */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <button
            onClick={handleNewFormation}
            className="col-span-full md:col-span-1 flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <PlusIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">+ Νέα Σύνθεση</p>
              <p className="text-sm mt-1">
                Δεν έχετε δημιουργήσει σύνθεση ακόμα!<br />
                Φτιάξτε την πρώτη σας ονειρεμένη κυβέρνηση.
              </p>
            </div>
          </button>
        </div>
      ) : (
        /* Grid */
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

          {formations.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
              isOwner
              onEdit={() => handleEdit(formation)}
              onDelete={() => handleDelete(formation.id)}
              onLike={() => handleLike(formation.id)}
              onShareCopy={() => handleShareCopy(formation)}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
