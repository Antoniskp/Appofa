'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAuth } from '@/lib/auth-context';
import DreamTeamHero from '@/components/dream-team/DreamTeamHero';
import PositionCard from '@/components/dream-team/PositionCard';
import DreamTeamResults from '@/components/dream-team/DreamTeamResults';
import SkeletonPositionCard from '@/components/dream-team/SkeletonPositionCard';
import FormationList from '@/components/dream-team/FormationList';
import ExploreFormations from '@/components/dream-team/ExploreFormations';
import PopularPicks from '@/components/dream-team/PopularPicks';
import FormationOfTheWeek from '@/components/dream-team/FormationOfTheWeek';
import Leaderboard from '@/components/dream-team/Leaderboard';
import ActivityFeed from '@/components/dream-team/ActivityFeed';
import FormationComparison from '@/components/dream-team/FormationComparison';
import EmptyState from '@/components/ui/EmptyState';

/** Identifies a formation as the Primary Formation. */
function isPrimaryFormation(f) {
  return f?.isPrimary === true || (f?.name === 'Η Κυβέρνησή μου' && f?.category === 'serious');
}

/**
 * Builds a slug-keyed map of the current picks for a formation.
 * Used for background vote↔formation sync in handleVote / handleDeleteVote.
 */
function buildPrimaryPicksMap(formation) {
  return (formation.picks || []).reduce((acc, p) => {
    acc[p.positionSlug || p.slug] = p;
    return acc;
  }, {});
}

/**
 * Fire-and-forget: persist a new picks map to the Primary Formation and update
 * the ref if successful. Non-blocking — errors are silently swallowed.
 */
function syncPrimaryFormationPicks(formation, picksMap) {
  const picksArray = Object.values(picksMap).filter(
    (p) => p && (p.personId || p.candidateUserId || p.personName),
  );
  dreamTeamAPI.updateFormationPicks(formation.id, picksArray)
    .then((res) => {
      if (res?.success) {
        // Mutate the ref directly since it is not React state
        Object.assign(formation, { picks: res.data?.picks || picksArray });
      }
    })
    .catch(() => {}); // Non-critical, fire-and-forget
}

const TABS = [
  { id: 'vote', label: '🗳️ Ψηφίστε' },
  { id: 'formations', label: '📋 Οι Συνθέσεις μου' },
  { id: 'explore', label: '🌍 Εξερεύνηση' },
  { id: 'results', label: '🏆 Ιδανική Κυβέρνηση' },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

function DreamTeamPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive initial tab from the URL ?tab= param, falling back to 'vote'
  const initialTab = (() => {
    const t = searchParams.get('tab');
    return t && VALID_TABS.has(t) ? t : 'vote';
  })();

  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [myVotesMap, setMyVotesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [votingPosition, setVotingPosition] = useState(null);
  const [toast, setToast] = useState(null);
  const [totalPublicFormations, setTotalPublicFormations] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Keep refs so callbacks always read latest values (avoid stale closures)
  const myVotesMapRef = useRef({});
  useEffect(() => { myVotesMapRef.current = myVotesMap; }, [myVotesMap]);

  const positionsRef = useRef([]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  // Holds the Primary Formation for background vote↔formation sync
  const primaryFormationRef = useRef(null);

  // Reactive copy of the Primary Formation's picks — passed to ExploreFormations
  const [primaryPicks, setPrimaryPicks] = useState([]);

  // Set lastUpdated only on the client to avoid SSR/hydration mismatch
  useEffect(() => { setLastUpdated(new Date().toISOString()); }, []);

  // Comparison tool state
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareFormation, setCompareFormation] = useState(null);
  const [publicFormationsForCompare, setPublicFormationsForCompare] = useState([]);
  const [myFormationsForCompare, setMyFormationsForCompare] = useState([]);

  /** Switch tab and update the URL (replaceState — no new history entry). */
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const url = tabId === 'vote' ? '/dream-team' : `/dream-team?tab=${tabId}`;
    router.replace(url, { scroll: false });
  }, [router]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, resRes] = await Promise.all([
        dreamTeamAPI.getPositions(),
        dreamTeamAPI.getResults(),
      ]);

      if (posRes?.success) setPositions(posRes.data || []);
      if (resRes?.success) setResults(resRes.data || []);

      if (user) {
        try {
          const [votesRes, formationsRes] = await Promise.all([
            dreamTeamAPI.getMyVotes(),
            dreamTeamAPI.getMyFormations(),
          ]);
          if (votesRes?.success) {
            const map = {};
            (votesRes.data || []).forEach((v) => {
              map[v.positionId] = v;
            });
            setMyVotesMap(map);
          }
          if (formationsRes?.success) {
            const primary = (formationsRes.data || []).find(isPrimaryFormation);
            if (primary) {
              primaryFormationRef.current = primary;
              setPrimaryPicks(primary.picks || []);
            }
          }
        } catch {
          // my-votes / formations are not critical
        }
      }

      // Load total public formations count for the hero stat
      try {
        const pubRes = await dreamTeamAPI.getPublicFormations({ limit: 1 });
        if (pubRes?.success) setTotalPublicFormations(pubRes.pagination?.total || 0);
      } catch {
        // Non-critical
      }
    } catch (err) {
      setError(err.message || 'Σφάλμα κατά τη φόρτωση δεδομένων');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = useCallback(async (positionId, personId, candidateUserId) => {
    setVotingPosition(positionId);
    try {
      // Check if this person is already voted for in a different position
      if (personId) {
        const conflict = Object.values(myVotesMapRef.current).find(
          (v) => v.personId === personId && v.positionId !== positionId,
        );
        if (conflict) {
          showToast('Αυτό το πρόσωπο έχει ήδη επιλεγεί σε άλλη θέση. Αφαιρέστε το πρώτα από εκείνη τη θέση.', 'error');
          return;
        }
      } else if (candidateUserId) {
        const conflict = Object.values(myVotesMapRef.current).find(
          (v) => v.candidateUserId === candidateUserId && v.positionId !== positionId,
        );
        if (conflict) {
          showToast('Αυτό το πρόσωπο έχει ήδη επιλεγεί σε άλλη θέση. Αφαιρέστε το πρώτα από εκείνη τη θέση.', 'error');
          return;
        }
      }

      const res = await dreamTeamAPI.vote(positionId, personId, candidateUserId);
      if (res?.success) {
        showToast(res.message || 'Ψήφος καταγράφηκε!');
        // Update myVotesMap optimistically
        setMyVotesMap((prev) => ({
          ...prev,
          [positionId]: {
            positionId,
            personId: personId || null,
            candidateUserId: candidateUserId || null,
            personName: res.data?.personName,
          },
        }));
        // Refresh positions to get updated vote counts
        const posRes = await dreamTeamAPI.getPositions();
        if (posRes?.success) setPositions(posRes.data || []);
        const resRes = await dreamTeamAPI.getResults();
        if (resRes?.success) setResults(resRes.data || []);

        // Background sync: update the Primary Formation pick for this position
        if (primaryFormationRef.current) {
          const primaryFormation = primaryFormationRef.current;
          const position = positionsRef.current.find((p) => p.id === positionId);
          if (position) {
            const updatedPicks = buildPrimaryPicksMap(primaryFormation);
            updatedPicks[position.slug] = {
              positionSlug: position.slug,
              personId: personId || null,
              candidateUserId: candidateUserId || null,
              personName: res.data?.personName || null,
            };
            syncPrimaryFormationPicks(primaryFormation, updatedPicks);
            setPrimaryPicks(Object.values(updatedPicks));
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά την καταγραφή ψήφου', 'error');
    } finally {
      setVotingPosition(null);
    }
  }, [showToast]);

  const handleDeleteVote = useCallback(async (positionId) => {
    setVotingPosition(positionId);
    try {
      const res = await dreamTeamAPI.deleteVote(positionId);
      if (res?.success) {
        showToast('Η ψήφος σας διαγράφηκε.');
        setMyVotesMap((prev) => {
          const updated = { ...prev };
          delete updated[positionId];
          return updated;
        });
        const posRes = await dreamTeamAPI.getPositions();
        if (posRes?.success) setPositions(posRes.data || []);
        const resRes = await dreamTeamAPI.getResults();
        if (resRes?.success) setResults(resRes.data || []);

        // Background sync: remove the pick from the Primary Formation
        if (primaryFormationRef.current) {
          const primaryFormation = primaryFormationRef.current;
          const position = positionsRef.current.find((p) => p.id === positionId);
          if (position) {
            const updatedPicks = buildPrimaryPicksMap(primaryFormation);
            delete updatedPicks[position.slug];
            syncPrimaryFormationPicks(primaryFormation, updatedPicks);
            setPrimaryPicks(Object.values(updatedPicks));
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά τη διαγραφή ψήφου.', 'error');
    } finally {
      setVotingPosition(null);
    }
  }, [showToast]);

  // Called by FormationList when the Primary Formation saves picks → votes sync
  const handleVotesChanged = useCallback(async () => {
    try {
      const [votesRes, posRes, resRes] = await Promise.all([
        dreamTeamAPI.getMyVotes(),
        dreamTeamAPI.getPositions(),
        dreamTeamAPI.getResults(),
      ]);
      if (votesRes?.success) {
        const map = {};
        (votesRes.data || []).forEach((v) => { map[v.positionId] = v; });
        setMyVotesMap(map);
      }
      if (posRes?.success) setPositions(posRes.data || []);
      if (resRes?.success) setResults(resRes.data || []);
      // Refresh the primary formation ref so it stays current
      try {
        const formationsRes = await dreamTeamAPI.getMyFormations();
        if (formationsRes?.success) {
          const primary = (formationsRes.data || []).find(isPrimaryFormation);
          if (primary) {
            primaryFormationRef.current = primary;
            setPrimaryPicks(primary.picks || []);
          }
        }
      } catch {
        // Non-critical
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Open comparison tool and lazily load formations for dropdowns
  const openCompare = useCallback(async (formation = null) => {
    setCompareFormation(formation);
    setCompareOpen(true);
    // Load options for comparison dropdowns
    try {
      const [pubRes, myRes] = await Promise.all([
        dreamTeamAPI.getPublicFormations({ limit: 50, sort: 'popular' }),
        user ? dreamTeamAPI.getMyFormations() : Promise.resolve(null),
      ]);
      if (pubRes?.success) setPublicFormationsForCompare(pubRes.data || []);
      if (myRes?.success) setMyFormationsForCompare(myRes.data || []);
    } catch {
      // Non-critical
    }
  }, [user]);

  const totalVotes = positions.reduce((sum, p) => {
    return sum + (p.votes || []).reduce((s, v) => s + parseInt(v.voteCount, 10), 0);
  }, 0);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
            role="alert"
          >
            {toast.message}
          </div>
        )}

        <DreamTeamHero
          totalVotes={totalVotes}
          totalFormations={totalPublicFormations}
          lastUpdated={lastUpdated}
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <EmptyState
            type="error"
            title="Σφάλμα Φόρτωσης"
            description={error}
            action={{ text: 'Δοκιμάστε Ξανά', onClick: loadData }}
          />
        )}

        {/* Vote Tab */}
        {!error && activeTab === 'vote' && (
          <>
            {!user && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                💡 <strong>Συνδεθείτε</strong> για να καταγράψετε τις ψήφους σας και να συμβάλετε στη διαμόρφωση της ιδανικής κυβέρνησης.
              </div>
            )}
            {user && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center justify-between gap-4">
                <span>🔗 Οι ψήφοι σας συγχρονίζονται αυτόματα με την &ldquo;Η Κυβέρνησή μου&rdquo; στις Συνθέσεις σας.</span>
                <button
                  onClick={() => handleTabChange('formations')}
                  className="shrink-0 text-xs font-semibold underline hover:no-underline whitespace-nowrap"
                >
                  Δείτε τη Σύνθεσή σας →
                </button>
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonPositionCard key={i} />
                ))}
              </div>
            ) : positions.length === 0 ? (
              <EmptyState
                type="empty"
                title="Δεν βρέθηκαν θέσεις"
                description="Δεν υπάρχουν ενεργές κυβερνητικές θέσεις προς ψηφοφορία."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {positions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    myVote={myVotesMap[position.id] || null}
                    onVote={user ? handleVote : undefined}
                    onDeleteVote={user ? handleDeleteVote : undefined}
                    loading={votingPosition === position.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Results Tab */}
        {!error && activeTab === 'results' && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonPositionCard key={i} />
              ))}
            </div>
          ) : (
            <DreamTeamResults results={results} />
          )
        )}

        {/* Formations Tab */}
        {activeTab === 'formations' && (
          !user ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <span className="text-4xl mb-4 block">🔒</span>
              <p className="text-lg font-bold text-gray-800 mb-2">Συνδεθείτε για να δείτε τις συνθέσεις σας</p>
              <p className="text-sm text-gray-500">
                Δημιουργήστε και διαχειριστείτε τις δικές σας ιδανικές κυβερνήσεις.
              </p>
            </div>
          ) : (
            <FormationList
              user={user}
              communityResults={results}
              showToast={showToast}
              onCompare={openCompare}
              positions={positions}
              myVotes={Object.values(myVotesMap)}
              onVotesChanged={handleVotesChanged}
            />
          )
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <>
            <FormationOfTheWeek
              onLike={async (id) => {
                if (!user) { showToast('Συνδεθείτε για να κάνετε like', 'error'); return; }
                try {
                  await dreamTeamAPI.likeFormation(id);
                } catch { /* non-critical */ }
              }}
              onCompare={(f) => openCompare(f)}
              showToast={showToast}
            />
            <PopularPicks />
            <Leaderboard currentUserId={user?.id} />
            <ActivityFeed />
            <ExploreFormations
              showToast={showToast}
              onCompare={openCompare}
              primaryPicks={primaryPicks}
            />
          </>
        )}
      </div>

      {/* Comparison Modal */}
      {compareOpen && (
        <FormationComparison
          formationA={compareFormation}
          publicFormations={publicFormationsForCompare}
          myFormations={myFormationsForCompare}
          onClose={() => { setCompareOpen(false); setCompareFormation(null); }}
        />
      )}
    </div>
  );
}

export default function DreamTeamPage() {
  return (
    <Suspense fallback={null}>
      <DreamTeamPageInner />
    </Suspense>
  );
}
