'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ApplicationDetailPage({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: application, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await candidateAPI.getApplicationById(id);
      return res.data?.application || null;
    },
    [id],
    { initialData: null }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/'); return null;
  }

  const handleApprove = async () => {
    if (!window.confirm('Approve this application? A candidate profile will be created.')) return;
    setProcessing(true); setActionError('');
    try { await candidateAPI.approveApplication(id); refetch?.(); }
    catch (err) { setActionError(err.message || 'Failed to approve.'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    setProcessing(true); setActionError('');
    try { await candidateAPI.rejectApplication(id, { rejectionReason }); refetch?.(); }
    catch (err) { setActionError(err.message || 'Failed to reject.'); }
    finally { setProcessing(false); }
  };

  if (authLoading || loading) return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;

  if (error || !application) {
    return <div className="app-container py-10 text-center"><p className="text-red-500">Application not found.</p></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-2xl mx-auto">
        <Link href="/admin/candidates/applications" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Applications</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Application #{application.id}</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{application.fullName}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : application.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {application.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">Applicant: <span className="text-gray-800 font-medium">{application.applicant?.username}</span> ({application.applicant?.email})</p>
          {application.constituency && <p className="text-sm text-gray-500">Constituency: <span className="text-gray-800">{application.constituency.name}</span></p>}
          {application.bio && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Biography</p><p className="text-sm text-gray-700">{application.bio}</p></div>}
          {application.supportingStatement && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Supporting Statement</p><p className="text-sm text-gray-700">{application.supportingStatement}</p></div>}
          {application.manifesto && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Manifesto</p><p className="text-sm text-gray-700">{application.manifesto}</p></div>}
          {application.status === 'rejected' && application.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          )}
          {application.candidateProfile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">Profile created: <Link href={`/candidates/${application.candidateProfile.slug}`} className="underline">{application.candidateProfile.fullName}</Link></p>
            </div>
          )}
        </div>

        {application.status === 'pending' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Review Application</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (for reject only)</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {actionError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={processing}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {processing ? '...' : '✓ Approve'}
              </button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {processing ? '...' : '✗ Reject'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
