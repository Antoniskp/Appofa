'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { locationElectionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/components/ToastProvider';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

const DEFAULT_AVATAR_COLOR = '#64748b';

function displayName(user) {
  const fullName = [user?.firstNameNative, user?.lastNameNative].filter(Boolean).join(' ').trim();
  return fullName || user?.username || 'Χρήστης';
}

function Avatar({ candidate }) {
  const name = displayName(candidate);
  const initials = (candidate?.username || name || 'U').charAt(0).toUpperCase();

  if (candidate?.avatar) {
    return (
      <img
        src={candidate.avatar}
        alt={name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
      style={{ backgroundColor: candidate?.avatarColor || DEFAULT_AVATAR_COLOR }}
      aria-label={`Avatar για ${name}`}
    >
      {initials}
    </div>
  );
}

export default function LocationElectionsTab({
  locationId,
  locationType,
  isAuthenticated,
  userHomeLocationId,
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [votingFor, setVotingFor] = useState(null);

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
    { initialData: { elections: [], locationType } }
  );

  const canVote = useMemo(
    () => isAuthenticated && Number(userHomeLocationId) === Number(locationId),
    [isAuthenticated, userHomeLocationId, locationId]
  );

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
        <div key={election.roleKey} className="border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base font-semibold text-gray-900">{election.roleTitle}</h3>
            {election.currentHolder ? (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                Τρέχων Κάτοχος: {election.currentHolder.username ? `@${election.currentHolder.username}` : displayName(election.currentHolder)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                Κενή θέση
              </span>
            )}
          </div>

          {election.results.length === 0 ? (
            <p className="text-sm text-gray-500">Δεν υπάρχουν ακόμα μέλη σε αυτή την τοποθεσία.</p>
          ) : (
            <div className="space-y-3">
              {election.results.map((candidate) => {
                const isMyVote = election.myVote?.candidateUserId === candidate.userId;
                const disabled = votingFor === election.roleKey;
                const name = displayName(candidate);

                return (
                  <div key={candidate.userId} className="border border-gray-100 rounded-md p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar candidate={candidate} />
                        <div className="min-w-0">
                          {candidate.slug ? (
                            <Link href={`/persons/${candidate.slug}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                          )}
                          <p className="text-xs text-gray-500">{candidate.username ? `@${candidate.username}` : 'Χωρίς username'}</p>
                        </div>
                      </div>
                      {canVote && (
                        isMyVote ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveVote(election.roleKey)}
                            disabled={disabled}
                            aria-label={`Αφαίρεση ψήφου για ${name}`}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            ✓ Η ψήφος σου
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCastVote(election.roleKey, candidate.userId)}
                            disabled={disabled}
                            aria-label={`Ψήφισε τον/την ${name}`}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            Ψήφισε
                          </button>
                        )
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {candidate.votes} ψήφοι · {candidate.percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isAuthenticated && (
            <p className="mt-3 text-xs text-gray-500">Συνδεθείτε για να ψηφίσετε.</p>
          )}
          {isAuthenticated && !canVote && (
            <p className="mt-3 text-xs text-amber-700">Δεν είστε μέλος αυτής της τοποθεσίας.</p>
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
