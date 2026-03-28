'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { candidateAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';

function ClaimBadge({ status }) {
  const map = {
    unclaimed: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    claimed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AdminCandidateDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [appointForm, setAppointForm] = useState({ position: '', constituencyId: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: profile, loading, error, refetch } = useAsyncData(
    async () => {
      if (!id) return null;
      const res = await candidateAPI.getById(id);
      return res.data?.profile || null;
    },
    [id],
    { initialData: null }
  );

  const { data: locations } = useAsyncData(
    async () => {
      const res = await locationAPI.getAll({ limit: 200 });
      return res.data || [];
    },
    [],
    { initialData: [] }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/');
    return null;
  }

  const handleAppoint = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      const payload = { position: appointForm.position };
      if (appointForm.constituencyId) payload.constituencyId = parseInt(appointForm.constituencyId, 10);
      await candidateAPI.appointAsCandidate(id, payload);
      setActionSuccess('Candidate appointed successfully.');
      setAppointForm({ position: '', constituencyId: '' });
      refetch?.();
    } catch (err) {
      setActionError(err.message || 'Failed to appoint candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetire = async () => {
    if (!window.confirm('Retire this candidate? They will no longer appear as an active candidate.')) return;
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await candidateAPI.retireCandidate(id);
      setActionSuccess('Candidate retired successfully.');
      refetch?.();
    } catch (err) {
      setActionError(err.message || 'Failed to retire candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl mx-auto">
          <Link href="/admin/candidates" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Profiles</Link>
          <p className="text-red-500">Failed to load candidate profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl mx-auto">
        <Link href="/admin/candidates" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Profiles</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {profile.photo && (
              <img src={profile.photo} alt={profile.fullName} className="w-20 h-20 rounded-full object-cover border border-gray-200 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">/{profile.slug}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <ClaimBadge status={profile.claimStatus} />
                {profile.source && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                    {profile.source}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-700 mb-1">Biography</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {profile.constituency && (
              <div>
                <span className="text-gray-500">Constituency:</span>{' '}
                <span className="text-gray-800">{profile.constituency.name}</span>
              </div>
            )}
            {profile.position && (
              <div>
                <span className="text-gray-500">Position:</span>{' '}
                <span className="text-gray-800 capitalize">{profile.position}</span>
              </div>
            )}
            {profile.contactEmail && (
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="text-gray-800">{profile.contactEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Appointment status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Status</h2>

          {actionError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{actionError}</p>
          )}
          {actionSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{actionSuccess}</p>
          )}

          {profile.isActiveCandidate ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Active Candidate
                </span>
                {profile.appointedAt && (
                  <span className="text-sm text-gray-500">
                    Appointed {new Date(profile.appointedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={handleRetire}
                disabled={actionLoading}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Retire Candidate'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
                  Not Active
                </span>
                {profile.retiredAt && (
                  <span className="text-sm text-gray-500">
                    Retired {new Date(profile.retiredAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Appoint as Candidate</h3>
              <form onSubmit={handleAppoint} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={appointForm.position}
                    onChange={(e) => setAppointForm((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select position</option>
                    <option value="mayor">Mayor</option>
                    <option value="prefect">Prefect</option>
                    <option value="parliamentary">Parliamentary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constituency (optional)</label>
                  <select
                    value={appointForm.constituencyId}
                    onChange={(e) => setAppointForm((prev) => ({ ...prev, constituencyId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep existing / none</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Appoint'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
