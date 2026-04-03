'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ClaimDetailPage({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: profile, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await personAPI.getAll({ limit: 200 });
      return (res.data?.profiles || []).find((p) => p.id === parseInt(id, 10)) || null;
    },
    [id],
    { initialData: null }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/'); return null;
  }

  const handleApprove = async () => {
    if (!window.confirm('Approve this claim? The profile will be marked as verified.')) return;
    setProcessing(true); setActionError('');
    try { await personAPI.approveClaim(id); refetch?.(); }
    catch (err) { setActionError(err.message || 'Failed to approve.'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    setProcessing(true); setActionError('');
    try { await personAPI.rejectClaim(id, { reason }); refetch?.(); }
    catch (err) { setActionError(err.message || 'Failed to reject.'); }
    finally { setProcessing(false); }
  };

  if (authLoading || loading) return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;
  if (error || !profile) return <div className="app-container py-10 text-center"><p className="text-red-500">Profile not found.</p></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <Link href="/admin/persons/claims" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Claims</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Claim Review: {profile.fullName}</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">{profile.fullName}</h2>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{profile.claimStatus}</span>
          </div>
          {profile.constituency && <p className="text-sm text-gray-500">Constituency: <span className="text-gray-800">{profile.constituency.name}</span></p>}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Claimed By</p>
            <p className="text-sm text-gray-800">{profile.claimedBy?.username} ({profile.claimedBy?.email})</p>
          </div>
          {profile.claimRequestedAt && (
            <p className="text-xs text-gray-400">Requested: {new Date(profile.claimRequestedAt).toLocaleString()}</p>
          )}
          {profile.bio && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Bio</p><p className="text-sm text-gray-700">{profile.bio}</p></div>}
        </div>

        {profile.claimStatus === 'pending' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Review Claim</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (for reject only)</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={processing}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {processing ? '...' : '✓ Approve Claim'}
              </button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {processing ? '...' : '✗ Reject Claim'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
