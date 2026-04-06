'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAuth } from '@/lib/auth-context';
import FormationCard from './FormationCard';
import SkeletonPositionCard from './SkeletonPositionCard';

const CATEGORY_FILTERS = [
  { id: '', label: 'Όλες' },
  { id: 'serious', label: '🎯 Σοβαρές' },
  { id: 'fun', label: '😂 Αστείες' },
  { id: 'custom', label: '🎨 Προσαρμοσμένες' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: '❤️ Δημοφιλείς' },
  { id: 'newest', label: '🕐 Πρόσφατες' },
  { id: 'completed', label: '✅ Πιο ολοκληρωμένες' },
];

const PAGE_SIZE = 12;

/**
 * Computes how similar a formation's picks are to the user's Primary Formation picks.
 * Returns a percentage (0–100) or null if there are no overlapping filled positions.
 */
function computeMatchScore(formationPicks, primaryPicks) {
  if (!primaryPicks?.length || !formationPicks?.length) return null;

  const getSlug = (p) => p.positionSlug || p.slug;

  // Build a map of primary picks by positionSlug
  const primaryMap = {};
  primaryPicks.forEach((p) => {
    if (p.candidateUserId) {
      primaryMap[getSlug(p)] = p;
    }
  });

  let overlapping = 0; // positions where BOTH have a pick
  let matching = 0;    // positions where both picked the same person

  formationPicks.forEach((fp) => {
    if (!fp.candidateUserId) return;
    const pp = primaryMap[getSlug(fp)];
    if (!pp) return;

    overlapping++;
    if (fp.candidateUserId && fp.candidateUserId === pp.candidateUserId) {
      matching++;
    }
  });

  if (overlapping === 0) return null;
  return Math.round((matching / overlapping) * 100);
}

/**
 * ExploreFormations — browse public formations with filters, sort, and pagination.
 *
 * Props:
 *   showToast(msg, type) – notification handler
 *   onCompare(formation) – open comparison tool with this formation pre-selected
 *   primaryPicks         – picks array from the user's Primary Formation (for match score)
 */
export default function ExploreFormations({ showToast, onCompare, primaryPicks = [] }) {
  const router = useRouter();
  const { user } = useAuth();

  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchFormations = useCallback(async ({ cat, srt, pg, append = false }) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = { sort: srt, page: pg, limit: PAGE_SIZE };
      if (cat) params.category = cat;
      const res = await dreamTeamAPI.getPublicFormations(params);
      if (res?.success) {
        const data = res.data || [];
        setFormations((prev) => (append ? [...prev, ...data] : data));
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      }
    } catch {
      // Non-critical — keep current state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFormations({ cat: category, srt: sort, pg: 1 });
    setPage(1);
  }, [category, sort, fetchFormations]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFormations({ cat: category, srt: sort, pg: nextPage, append: true });
  };

  const handleLike = useCallback(async (formation) => {
    if (!user) {
      showToast('Συνδεθείτε για να δώσετε like', 'error');
      return;
    }
    try {
      const res = await dreamTeamAPI.likeFormation(formation.id);
      if (res?.success) {
        setFormations((prev) =>
          prev.map((f) =>
            f.id === formation.id
              ? { ...f, likedByMe: res.data?.likedByMe, likeCount: res.data?.likeCount ?? f.likeCount }
              : f,
          ),
        );
      }
    } catch {
      // Non-critical
    }
  }, [user, showToast]);

  const handleCardClick = (formation) => {
    router.push(`/dream-team/f/${formation.shareSlug || formation.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">🌍 Εξερεύνηση</h2>
        <p className="text-sm text-gray-400 mt-0.5">Δείτε δημόσιες ιδανικές κυβερνήσεις από άλλους χρήστες</p>
      </div>

      {/* Filter & Sort bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategory(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === filter.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSort(option.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sort === option.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && total > 0 && (
        <p className="text-xs text-gray-400">
          {total} {total === 1 ? 'σύνθεση' : 'συνθέσεις'} βρέθηκαν
        </p>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonPositionCard key={i} />)}
        </div>
      ) : formations.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <span className="text-4xl mb-4 block">🌍</span>
          <p className="text-lg font-bold text-gray-800 mb-2">Δεν υπάρχουν δημόσιες συνθέσεις ακόμα</p>
          <p className="text-sm text-gray-500 mb-6">
            Δημιουργήστε μία και κάντε την δημόσια για να εμφανιστεί εδώ!
          </p>
          <a
            href="/dream-team#formations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            📋 Οι Συνθέσεις μου
          </a>
        </div>
      ) : (
        /* Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {formations.map((formation) => (
              <FormationCard
                key={formation.id}
                formation={formation}
                isOwner={false}
                onLike={() => handleLike(formation)}
                onCompare={onCompare ? () => onCompare(formation) : undefined}
                showToast={showToast}
                onClick={() => handleCardClick(formation)}
                matchScore={computeMatchScore(formation.picks, primaryPicks)}
              />
            ))}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? '⏳ Φόρτωση…' : '+ Φόρτωση περισσότερων'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
