'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
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
import LoginLink from '@/components/ui/LoginLink';
import Link from 'next/link';
import { normalizeCountryCode, resolveUserDreamTeamCountryCode } from '@/lib/utils/userCountryCode';

/** Display metadata for known ISO country codes — used for flag/name enrichment only. */
const COUNTRY_META = {
  GR: { name: 'Ελλάδα', flag: '🇬🇷' },
  FR: { name: 'France', flag: '🇫🇷' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  ES: { name: 'España', flag: '🇪🇸' },
  IT: { name: 'Italia', flag: '🇮🇹' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  NL: { name: 'Netherlands', flag: '🇳🇱' },
  BE: { name: 'Belgium', flag: '🇧🇪' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  CY: { name: 'Κύπρος', flag: '🇨🇾' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  TR: { name: 'Turkey', flag: '🇹🇷' },
};

/** Identifies a formation as the Primary Formation. */
function isPrimaryFormation(f) {
  return f?.isPrimary === true || (f?.name === 'Η Κυβέρνησή μου' && f?.category === 'serious');
}

function buildPrimaryPicksMap(formation) {
  return (formation.picks || []).reduce((acc, p) => {
    acc[p.positionSlug || p.slug] = p;
    return acc;
  }, {});
}

function syncPrimaryFormationPicks(formation, picksMap) {
  const picksArray = Object.values(picksMap).filter(
    (p) => p && (p.candidateUserId || p.personName),
  );
  dreamTeamAPI.updateFormationPicks(formation.id, picksArray)
    .then((res) => {
      if (res?.success) {
        Object.assign(formation, { picks: res.data?.picks || picksArray });
      }
    })
    .catch(() => {});
}

const TABS = [
  { id: 'vote', label: '🗳️ Ψηφίστε' },
  { id: 'formations', label: '📋 Οι Συνθέσεις μου' },
  { id: 'explore', label: '🌍 Εξερεύνηση' },
  { id: 'results', label: '🏆 Ιδανική Κυβέρνηση' },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

function DreamTeamCountryPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  // Normalize countryCode to uppercase
  const countryCode = (params.countryCode || 'gr').toUpperCase();
  const countryMeta = COUNTRY_META[countryCode] || { name: countryCode, flag: '🌐' };

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
  const [availableCountryCodes, setAvailableCountryCodes] = useState([]);

  const myVotesMapRef = useRef({});
  useEffect(() => { myVotesMapRef.current = myVotesMap; }, [myVotesMap]);

  const positionsRef = useRef([]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  const primaryFormationRef = useRef(null);
  const [primaryPicks, setPrimaryPicks] = useState([]);

  useEffect(() => { setLastUpdated(new Date().toISOString()); }, []);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareFormation, setCompareFormation] = useState(null);
  const [publicFormationsForCompare, setPublicFormationsForCompare] = useState([]);
  const [myFormationsForCompare, setMyFormationsForCompare] = useState([]);

  const userCountryCode = availableCountryCodes.length > 0
    ? resolveUserDreamTeamCountryCode(user, { allowedCountryCodes: availableCountryCodes })
    : null;
  const isOwnCountryContext = !user || !userCountryCode || userCountryCode === countryCode;

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const base = `/dream-team/${params.countryCode}`;
    const url = tabId === 'vote' ? base : `${base}?tab=${tabId}`;
    router.replace(url, { scroll: false });
  }, [router, params.countryCode]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, resRes, countriesRes] = await Promise.all([
        dreamTeamAPI.getPositions(countryCode),
        dreamTeamAPI.getResults(countryCode),
        dreamTeamAPI.getCountries(),
      ]);

      if (posRes?.success) setPositions(posRes.data || []);
      if (resRes?.success) setResults(resRes.data || []);
      if (countriesRes?.success) {
        setAvailableCountryCodes(
          (countriesRes.data || [])
            .map((country) => normalizeCountryCode(country.countryCode))
            .filter(Boolean),
        );
      }

      if (user) {
        try {
          const [votesRes, formationsRes] = await Promise.all([
            dreamTeamAPI.getMyVotes(),
            dreamTeamAPI.getMyFormations(),
          ]);
          if (votesRes?.success) {
            const map = {};
            (votesRes.data || []).forEach((v) => { map[v.positionId] = v; });
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
  }, [user, countryCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = useCallback(async (positionId, candidateUserId) => {
    setVotingPosition(positionId);
    try {
      if (candidateUserId) {
        const conflict = Object.values(myVotesMapRef.current).find(
          (v) => v.candidateUserId === candidateUserId && v.positionId !== positionId,
        );
        if (conflict) {
          showToast('Αυτό το πρόσωπο έχει ήδη επιλεγεί σε άλλη θέση. Αφαιρέστε το πρώτα από εκείνη τη θέση.', 'error');
          return;
        }
      }

      const res = await dreamTeamAPI.vote(positionId, candidateUserId);
      if (res?.success) {
        showToast(res.message || 'Ψήφος καταγράφηκε!');
        setMyVotesMap((prev) => ({
          ...prev,
          [positionId]: {
            positionId,
            candidateUserId: candidateUserId || null,
            personName: res.data?.personName,
          },
        }));
        const [posRes, resRes] = await Promise.all([
          dreamTeamAPI.getPositions(countryCode),
          dreamTeamAPI.getResults(countryCode),
        ]);
        if (posRes?.success) setPositions(posRes.data || []);
        if (resRes?.success) setResults(resRes.data || []);

        if (primaryFormationRef.current) {
          const primaryFormation = primaryFormationRef.current;
          const position = positionsRef.current.find((p) => p.id === positionId);
          if (position) {
            const updatedPicks = buildPrimaryPicksMap(primaryFormation);
            updatedPicks[position.slug] = {
              positionSlug: position.slug,
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
  }, [showToast, countryCode]);

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
        const [posRes, resRes] = await Promise.all([
          dreamTeamAPI.getPositions(countryCode),
          dreamTeamAPI.getResults(countryCode),
        ]);
        if (posRes?.success) setPositions(posRes.data || []);
        if (resRes?.success) setResults(resRes.data || []);

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
  }, [showToast, countryCode]);

  const handleVotesChanged = useCallback(async () => {
    try {
      const [votesRes, posRes, resRes] = await Promise.all([
        dreamTeamAPI.getMyVotes(),
        dreamTeamAPI.getPositions(countryCode),
        dreamTeamAPI.getResults(countryCode),
      ]);
      if (votesRes?.success) {
        const map = {};
        (votesRes.data || []).forEach((v) => { map[v.positionId] = v; });
        setMyVotesMap(map);
      }
      if (posRes?.success) setPositions(posRes.data || []);
      if (resRes?.success) setResults(resRes.data || []);
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
  }, [countryCode]);

  const openCompare = useCallback(async (formation = null) => {
    setCompareFormation(formation);
    setCompareOpen(true);
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

        {/* Country breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dream-team" className="hover:text-blue-600 transition-colors">
            🌍 Dream Team
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-700">
            {countryMeta.flag} {countryMeta.name}
          </span>
          <span className="text-gray-300">•</span>
          <Link href="/dream-team" className="hover:text-blue-600 transition-colors">
            Άλλες χώρες
          </Link>
        </div>

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
              <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-amber-900 font-semibold text-base mb-2">
                  💡 Συνδεθείτε για να ψηφίσετε
                </p>
                <p className="text-amber-800 text-sm mb-4">
                  Καταγράψτε τις ψήφους σας και συμβάλετε στη διαμόρφωση της ιδανικής κυβέρνησης.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <LoginLink
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Σύνδεση
                  </LoginLink>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-amber-800 text-sm font-semibold rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    Εγγραφή
                  </Link>
                </div>
              </div>
            )}
            {user && isOwnCountryContext && (
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
            {user && !isOwnCountryContext && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm flex items-center justify-between gap-4">
                <span>
                  🌍 Παρακολουθείτε το Dream Team της {countryMeta.flag} {countryMeta.name}. Η ψηφοφορία επιτρέπεται μόνο στη δική σας χώρα.
                </span>
                <Link
                  href={`/dream-team/${userCountryCode?.toLowerCase()}`}
                  className="shrink-0 text-xs font-semibold underline hover:no-underline whitespace-nowrap"
                >
                  Ψηφίστε στη χώρα σας →
                </Link>
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
                description={`Δεν υπάρχουν ενεργές κυβερνητικές θέσεις για ${countryMeta.flag} ${countryMeta.name}.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {positions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    myVote={myVotesMap[position.id] || null}
                    onVote={user && isOwnCountryContext ? handleVote : undefined}
                    onDeleteVote={user && isOwnCountryContext ? handleDeleteVote : undefined}
                    loading={votingPosition === position.id}
                    // Non-GR countries restrict the person search to nationals of that
                    // country. GR keeps the original open-search behaviour (no filter)
                    // because the nationality filter requirement is scoped to CY only.
                    nationalityFilter={countryCode !== 'GR' ? countryCode : undefined}
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

export default function DreamTeamCountryPage() {
  return (
    <Suspense fallback={null}>
      <DreamTeamCountryPageInner />
    </Suspense>
  );
}
