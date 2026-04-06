'use client';

import { useState, useCallback } from 'react';
import { ArrowLeftIcon, CheckIcon, GlobeAltIcon, LockClosedIcon, ShareIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import PersonSearch from './PersonSearch';
import ShareModal from './ShareModal';
import positionsData from '@/config/governmentPositions.json';

const FORMATION_CATEGORIES = [
  { id: 'serious', label: 'Σοβαρή', emoji: '🎯', color: 'bg-blue-100 text-blue-700' },
  { id: 'fun', label: 'Αστεία', emoji: '😂', color: 'bg-amber-100 text-amber-700' },
  { id: 'custom', label: 'Προσαρμοσμένη', emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
];

const ALL_POSITIONS = positionsData.positions;
const TOTAL = ALL_POSITIONS.length;

const TOP_POSITIONS = ALL_POSITIONS.filter(
  (p) => p.positionTypeKey !== 'minister',
);
const MINISTER_POSITIONS = ALL_POSITIONS.filter(
  (p) => p.positionTypeKey === 'minister',
);

// Stable empty arrays used as default prop values to avoid unnecessary re-renders
const EMPTY_POSITIONS = [];
const EMPTY_VOTES = [];

/**
 * FormationBuilder — full editor for creating/editing a formation.
 *
 * Props:
 *   formation      – existing formation object to edit (null when creating new)
 *   communityResults – array of community results (for quick-fill)
 *   onSave(formation) – called with the saved formation after API success
 *   onBack()       – called when user cancels / goes back
 *   showToast(msg, type) – show a notification
 *   isPrimary      – whether this is the user's primary (guarded) formation
 *   positions      – positions array with id+slug (only passed when isPrimary)
 *   myVotes        – user's current votes array (only passed when isPrimary)
 *   onVotesChanged() – callback after picks→votes sync (only passed when isPrimary)
 */
export default function FormationBuilder({ formation, communityResults = [], onSave, onBack, showToast, isPrimary = false, positions = EMPTY_POSITIONS, myVotes = EMPTY_VOTES, onVotesChanged }) {
  const isNew = !formation?.id;

  const [name, setName] = useState(formation?.name || '');
  const [category, setCategory] = useState(formation?.category || 'serious');
  const [description, setDescription] = useState(formation?.description || '');
  const [isPublic, setIsPublic] = useState(formation?.isPublic ?? false);
  const [savedFormationData, setSavedFormationData] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  // picks: { [positionSlug]: { personId, candidateUserId, personName, photo, avatar } }
  const [picks, setPicks] = useState(() => {
    const map = {};
    (formation?.picks || []).forEach((p) => {
      map[p.positionSlug || p.slug] = p;
    });

    // For the primary formation with no existing picks, pre-populate from the user's votes
    if (isPrimary && Object.keys(map).length === 0 && myVotes?.length && positions?.length) {
      const positionById = {};
      positions.forEach((p) => { positionById[p.id] = p; });
      myVotes.forEach((vote) => {
        const position = positionById[vote.positionId];
        if (position?.slug) {
          map[position.slug] = {
            positionSlug: position.slug,
            personId: vote.personId || null,
            candidateUserId: vote.candidateUserId || null,
            personName: vote.personName || null,
            photo: vote.person?.photo || null,
            avatar: vote.candidateUser?.avatar || null,
          };
        }
      });
    }

    return map;
  });

  const [saving, setSaving] = useState(false);

  const filledCount = Object.values(picks).filter(
    (p) => p && (p.personId || p.candidateUserId || p.personName),
  ).length;

  const handlePickSelect = useCallback((slug, person) => {
    if (!person) {
      setPicks((prev) => {
        const updated = { ...prev };
        delete updated[slug];
        return updated;
      });
      return;
    }

    // Check if this person is already assigned to a different position
    const incomingPersonId = person.type === 'profile' ? person.id : null;
    const incomingCandidateUserId = person.type === 'user' ? person.id : null;
    const conflictEntry = Object.entries(picks).find(([existingSlug, pick]) => {
      if (existingSlug === slug || !pick) return false;
      if (incomingPersonId && pick.personId === incomingPersonId) return true;
      if (incomingCandidateUserId && pick.candidateUserId === incomingCandidateUserId) return true;
      return false;
    });
    if (conflictEntry) {
      const conflictPosition = ALL_POSITIONS.find((p) => p.slug === conflictEntry[0]);
      showToast(
        `Αυτό το πρόσωπο έχει ήδη επιλεγεί${conflictPosition ? ` ως ${conflictPosition.title}` : ' σε άλλη θέση'}. Αφαιρέστε το πρώτα από εκείνη τη θέση.`,
        'error',
      );
      return;
    }

    const displayName = person.type === 'user'
      ? ((`${person.firstNameNative || ''} ${person.lastNameNative || ''}`.trim()) || person.username)
      : `${person.firstNameNative} ${person.lastNameNative}`;
    setPicks((prev) => ({
      ...prev,
      [slug]: {
        positionSlug: slug,
        personId: person.type === 'profile' ? person.id : null,
        candidateUserId: person.type === 'user' ? person.id : null,
        personName: displayName,
        photo: person.photo || null,
        avatar: person.avatar || null,
      },
    }));
  }, [picks, showToast]);

  const handleRemovePick = useCallback((slug) => {
    setPicks((prev) => {
      const updated = { ...prev };
      delete updated[slug];
      return updated;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showToast('Δώστε ένα όνομα στη σύνθεσή σας', 'error');
      return;
    }
    setSaving(true);
    // Primary formation is always private; enforce here regardless of state
    const effectiveIsPublic = isPrimary ? false : isPublic;
    // Primary formation category is always locked to "serious"
    const effectiveCategory = isPrimary ? 'serious' : category;
    try {
      const picksArray = Object.values(picks).filter(
        (p) => p && (p.personId || p.candidateUserId || p.personName),
      );

      let saved;
      if (isNew) {
        const res = await dreamTeamAPI.createFormation({ name: name.trim(), category: effectiveCategory, description, isPublic: effectiveIsPublic });
        if (!res?.success) throw new Error(res?.message || 'Σφάλμα δημιουργίας');
        saved = res.data;
      } else {
        const res = await dreamTeamAPI.updateFormation(formation.id, {
          name: name.trim(),
          category: effectiveCategory,
          description,
          isPublic: effectiveIsPublic,
        });
        if (!res?.success) throw new Error(res?.message || 'Σφάλμα ενημέρωσης');
        saved = res.data;
      }

      // Update picks
      const picksRes = await dreamTeamAPI.updateFormationPicks(saved.id, picksArray);
      if (!picksRes?.success) throw new Error(picksRes?.message || 'Σφάλμα αποθήκευσης επιλογών');

      const fullFormation = { ...saved, picks: picksRes.data?.picks || picksArray };
      setSavedFormationData(fullFormation);

      showToast(isNew ? 'Η σύνθεση δημιουργήθηκε!' : 'Η σύνθεση αποθηκεύτηκε!');

      // If public (non-primary only), automatically open the share modal
      if (effectiveIsPublic) {
        setShareOpen(true);
      }

      // For the Primary Formation, sync picks → votes in the background
      if (isPrimary && positions?.length) {
        try {
          const positionBySlug = {};
          positions.forEach((p) => { positionBySlug[p.slug] = p; });

          const syncPromises = [];

          // Cast a vote for every filled pick
          picksArray.forEach((pick) => {
            const position = positionBySlug[pick.positionSlug];
            if (!position) return;
            syncPromises.push(
              dreamTeamAPI.vote(position.id, pick.personId || null, pick.candidateUserId || null)
                .catch(() => {}),
            );
          });

          // Delete votes for positions that were cleared in this save
          if (myVotes?.length) {
            myVotes.forEach((vote) => {
              const position = positions.find((p) => p.id === vote.positionId);
              if (position && !picks[position.slug]) {
                syncPromises.push(
                  dreamTeamAPI.deleteVote(vote.positionId).catch(() => {}),
                );
              }
            });
          }

          await Promise.all(syncPromises);
          if (syncPromises.length > 0) {
            showToast('Οι ψήφοι σας ενημερώθηκαν αυτόματα');
          }
          onVotesChanged?.();
        } catch {
          showToast('Η σύνθεση αποθηκεύτηκε, αλλά οι ψήφοι δεν συγχρονίστηκαν', 'error');
        }
      }

      onSave(fullFormation);
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά την αποθήκευση', 'error');
    } finally {
      setSaving(false);
    }
  }, [name, category, description, isPublic, isPrimary, picks, isNew, formation?.id, positions, myVotes, onVotesChanged, showToast, onSave]);

  const renderPositionRow = (position) => {
    const pick = picks[position.slug];
    const hasPick = !!(pick && (pick.personId || pick.candidateUserId || pick.personName));

    return (
      <div key={position.slug} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
        {/* Icon + title */}
        <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 text-lg">
          {position.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 mb-1.5">{position.title}</p>
          {hasPick ? (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              {(pick.photo || pick.avatar) ? (
                <img
                  src={pick.photo || pick.avatar}
                  alt={pick.personName}
                  className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="h-3 w-3 text-blue-600" />
                </div>
              )}
              <span className="text-sm font-medium text-blue-800 flex-1 truncate">{pick.personName}</span>
              <button
                onClick={() => handleRemovePick(position.slug)}
                className="text-xs text-blue-400 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Αφαίρεση"
              >
                ✕
              </button>
            </div>
          ) : (
            <PersonSearch
              placeholder="Αναζητήστε πρόσωπο..."
              showTopSuggestions
              includeUsers
              onSelect={(person) => handlePickSelect(position.slug, person)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Πίσω"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1">
          {isPrimary
            ? '✏️ Επεξεργασία — Η Κυβέρνησή μου'
            : isNew ? '✨ Νέα Σύνθεση' : '✏️ Επεξεργασία Σύνθεσης'}
        </h2>
        <div className="flex items-center gap-2">
          {savedFormationData && !isPrimary && (
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
              Κοινοποίηση
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Αποθήκευση…' : '💾 Αποθήκευση'}
          </button>
        </div>
      </div>

      {/* Formation metadata */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Όνομα Σύνθεσης
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="π.χ. Η σοβαρή μου κυβέρνηση"
            maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Κατηγορία
          </label>
          {isPrimary ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed select-none">
                🎯 Σοβαρή
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <LockClosedIcon className="h-3 w-3" /> Κλειδωμένη για την κύρια σύνθεση
              </span>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {FORMATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    category === cat.id
                      ? `${cat.color} border-current`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Περιγραφή <span className="text-gray-300 font-normal">(προαιρετικό)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Προσθέστε μια σημείωση..."
            rows={2}
            maxLength={300}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Public / Private toggle — hidden for primary formation (always private) */}
        {!isPrimary && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Ορατότητα
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPublic(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                !isPublic
                  ? 'bg-gray-100 border-gray-400 text-gray-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <LockClosedIcon className="h-3.5 w-3.5" />
              Ιδιωτική
            </button>
            <button
              onClick={() => setIsPublic(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                isPublic
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <GlobeAltIcon className="h-3.5 w-3.5" />
              Δημόσια
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isPublic
              ? 'Ορατή στην Εξερεύνηση — μπορεί να τη δει οποιοσδήποτε με τον σύνδεσμο.'
              : 'Ορατή μόνο σε όσους έχουν τον σύνδεσμο.'}
          </p>
        </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-800">
            {filledCount}/{TOTAL} θέσεις συμπληρώθηκαν
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {TOTAL - filledCount === 0 ? '🎉 Η σύνθεση είναι πλήρης!' : `${TOTAL - filledCount} θέσεις απομένουν`}
          </p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(filledCount / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {/* Top positions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🏛️</span> Ανώτατες Θέσεις
          </h3>
          <div className="divide-y divide-gray-50">
            {TOP_POSITIONS.map(renderPositionRow)}
          </div>
        </div>

        {/* Ministers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚖️</span> Υπουργικό Συμβούλιο
          </h3>
          <div className="divide-y divide-gray-50">
            {MINISTER_POSITIONS.map(renderPositionRow)}
          </div>
        </div>
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Αποθήκευση…' : '💾 Αποθήκευση Σύνθεσης'}
        </button>
      </div>

      {/* Share Modal */}
      {shareOpen && savedFormationData && (
        <ShareModal
          formation={savedFormationData}
          onClose={() => setShareOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

