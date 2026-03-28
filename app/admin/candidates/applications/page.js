'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import Pagination from '@/components/Pagination';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function AdminApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { data: applications, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await candidateAPI.getPendingApplications({ page, limit: 20 });
      if (res.success) {
        setTotalPages(res.data?.pagination?.totalPages || 1);
        return res.data?.applications || [];
      }
      return [];
    },
    [page],
    { initialData: [] }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/'); return null;
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this application?')) return;
    try { await candidateAPI.approveApplication(id); refetch?.(); }
    catch (err) { alert(err.message || 'Failed to approve.'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    try { await candidateAPI.rejectApplication(id, { rejectionReason: reason }); refetch?.(); }
    catch (err) { alert(err.message || 'Failed to reject.'); }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Candidate Applications</h1>
          <Link href="/admin/candidates" className="text-sm text-blue-600 hover:underline">← All Profiles</Link>
        </div>

        {loading && <SkeletonLoader count={5} type="card" />}
        {error && <p className="text-red-500">Failed to load applications.</p>}

        {!loading && applications.length === 0 && (
          <div className="text-center py-12 text-gray-500">No pending applications.</div>
        )}

        {!loading && applications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Constituency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <Link href={`/admin/candidates/applications/${app.id}`} className="font-medium text-blue-600 hover:underline">
                        {app.applicant?.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{app.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{app.constituency?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApprove(app.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve">
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleReject(app.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        <Link href={`/admin/candidates/applications/${app.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages}
              onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
              onPrev={() => setPage((p) => Math.max(p - 1, 1))}
              onGoTo={(p) => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}
