'use client';

import Link from 'next/link';
import { useState } from 'react';
import { locationElectionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/components/ToastProvider';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

function displayName(user) {
  const fullName = [user?.firstNameNative, user?.lastNameNative].filter(Boolean).join(' ').trim();
  return fullName || user?.username || 'Χρήστης';
}

export default function LocationElectionsTab({
  locationId,
  locationType,
  isAuthenticated,
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [votingFor, setVotingFor] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});

  const {
    data,
    loading,
    error,
    refetch,
  } = useAsyncData(
    async () => {
      const response = await locationElectionAPI.getElections(locationId);
      if (!response?.success) {
        throw new Error(response?.message || 'Αποτυχία φόρτωσης εκλογών.');
      }
      return response;
    },
    [locationId],
    { initialData: { elections: [], locationType, canVote: false } }
  );
  const canVote = data?.canVote ?? false;

  const handleCastVote = async (roleKey, candidateUserId) => {
    try {
      setVotingFor(roleKey);
      const response = await locationElectionAPI.castVote(locationId, roleKey, candidateUserId);
      if (!response?.success) {
        throw new Error(response?.message || 'Αποτυχία καταχώρησης ψήφου.');
      }
      toastSuccess(response.message || 'Η ψήφος σας καταχωρήθηκε.');
      await refetch();
    } catch (err) {
      toastError(err.message || 'Αποτυχία καταχώρησης ψήφου.');
    } finally {
      setVotingFor(null);
    }
  };

  const handleRemoveVote = async (roleKey) => {
    try {
      setVotingFor(roleKey);
      const response = await locationElectionAPI.removeVote(locationId, roleKey);
      if (!response?.success) {
        throw new Error(response?.message || 'Αποτυχία αφαίρεσης ψήφου.');
      }
      toastSuccess(response.message || 'Η ψήφος σας αφαιρέθηκε.');
      await refetch();
    } catch (err) {
      toastError(err.message || 'Αποτυχία αφαίρεσης ψήφου.');
    } finally {
      setVotingFor(null);
    }
  };

  if (loading) {
    return <SkeletonLoader type="list" count={2} />;
  }

  if (error) {
    return <AlertMessage tone="error" message={error} />;
  }

  const isCountry = (data?.locationType || locationType) === 'country';

  return (
    <div className="space-y-4">
      {(data?.elections || []).map((election) => (
        <div key={election.roleKey} className="border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">{election.roleTitle}</h3>
            {election.currentHolder ? (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                Τρέχων: {election.currentHolder.username ? `@${election.currentHolder.username}` : displayName(election.currentHolder)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                Κενή θέση
              </span>
            )}
          </div>

          {canVote && election.myVote && (() => {
            const myCandidate = election.results.find((result) => result.userId === election.myVote.candidateUserId);
            return myCandidate ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2 gap-2">
                <span className="text-sm text-blue-800">
                  ✓ Ψηφίσατε: <strong>{displayName(myCandidate)}</strong> (@{myCandidate.username})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveVote(election.roleKey)}
                  disabled={votingFor === election.roleKey}
                  className="ml-3 text-xs text-red-600 hover:text-red-800 disabled:opacity-60"
                >
                  ✕ Αφαίρεση ψήφου
                </button>
              </div>
            ) : null;
          })()}

          {canVote && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {election.myVote ? 'Αλλαγή ψήφου — αναζητήστε υποψήφιο:' : 'Ψηφίστε — αναζητήστε υποψήφιο:'}
              </label>
              <input
                type="text"
                placeholder="Αναζήτηση ονόματος ή username..."
                value={searchQueries[election.roleKey] || ''}
                onChange={(event) => setSearchQueries((prev) => ({ ...prev, [election.roleKey]: event.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(searchQueries[election.roleKey] || '').trim().length > 0 && (() => {
                const query = searchQueries[election.roleKey].trim().toLowerCase();
                const filteredCandidates = election.results.filter((candidate) => (
                  (candidate.username || '').toLowerCase().includes(query)
                  || (candidate.firstNameNative || '').toLowerCase().includes(query)
                  || (candidate.lastNameNative || '').toLowerCase().includes(query)
                ));

                return (
                  <div className="mt-1 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {filteredCandidates.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Δεν βρέθηκαν αποτελέσματα.</p>
                    ) : filteredCandidates.map((candidate) => {
                      const isMyVote = election.myVote?.candidateUserId === candidate.userId;
                      return (
                        <div key={candidate.userId} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{displayName(candidate)}</p>
                            <p className="text-xs text-gray-500">@{candidate.username} · {candidate.votes} ψήφοι</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleCastVote(election.roleKey, candidate.userId);
                              setSearchQueries((prev) => ({ ...prev, [election.roleKey]: '' }));
                            }}
                            disabled={votingFor === election.roleKey || isMyVote}
                            className={`ml-3 px-3 py-1 text-xs font-medium rounded-md disabled:opacity-60 ${
                              isMyVote
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isMyVote ? '✓ Ψήφος σας' : 'Ψήφισε'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          <p className="text-xs text-gray-500">{election.totalVotes} συνολικές ψήφοι</p>

          {!isAuthenticated && (
            <p className="text-xs text-gray-500">Συνδεθείτε για να ψηφίσετε.</p>
          )}
          {isAuthenticated && !canVote && (
            <p className="text-xs text-amber-700">Δεν είστε μέλος αυτής της τοποθεσίας ή κάποιας υποκείμενης τοποθεσίας.</p>
          )}

          {isCountry && election.roleKey === 'moderator' && (
            <div className="mt-4 border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900">🏛️ Εθνικές Θέσεις — Dream Team</p>
              <p className="mt-1 text-sm text-gray-700">
                Ψηφίστε για Πρόεδρο, Πρωθυπουργό και Πρόεδρο Βουλής στο Dream Team της χώρας.
              </p>
              <div className="mt-3">
                <Link
                  href="/dream-team"
                  className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Πήγαινε στο Dream Team →
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
