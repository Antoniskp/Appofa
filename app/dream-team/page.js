'use client';

import { useState, useEffect, useCallback } from 'react';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAuth } from '@/lib/auth-context';
import DreamTeamHero from '@/components/dream-team/DreamTeamHero';
import PositionCard from '@/components/dream-team/PositionCard';
import DreamTeamResults from '@/components/dream-team/DreamTeamResults';
import SkeletonPositionCard from '@/components/dream-team/SkeletonPositionCard';
import EmptyState from '@/components/EmptyState';

const TABS = [
  { id: 'vote', label: '🗳️ Ψηφίστε' },
  { id: 'results', label: '🏆 Ονειρεμένη Κυβέρνηση' },
];

export default function DreamTeamPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [myVotesMap, setMyVotesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('vote');
  const [votingPosition, setVotingPosition] = useState(null);
  const [toast, setToast] = useState(null);

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
          const votesRes = await dreamTeamAPI.getMyVotes();
          if (votesRes?.success) {
            const map = {};
            (votesRes.data || []).forEach((v) => {
              map[v.positionId] = v;
            });
            setMyVotesMap(map);
          }
        } catch {
          // my-votes is not critical
        }
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
      }
    } catch (err) {
      showToast(err.message || 'Σφάλμα κατά την καταγραφή ψήφου', 'error');
    } finally {
      setVotingPosition(null);
    }
  }, [showToast]);

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

        <DreamTeamHero totalVotes={totalVotes} lastUpdated={new Date().toISOString()} />

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
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
                💡 <strong>Συνδεθείτε</strong> για να καταγράψετε τις ψήφους σας και να συμβάλετε στη διαμόρφωση της ονειρεμένης κυβέρνησης.
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
      </div>
    </div>
  );
}
