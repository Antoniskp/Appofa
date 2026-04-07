'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function AdminClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { data: claims, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await personAPI.getPendingClaims({ page, limit: 20 });
      if (res.success) {
        setTotalPages(res.data?.pagination?.totalPages || 1);
        return res.data?.profiles || [];
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
    if (!window.confirm('Έγκριση αυτής της διεκδίκησης; Το προφίλ θα επισημανθεί ως διεκδικημένο.')) return;
    try { await personAPI.approveClaim(id); refetch?.(); }
    catch (err) { alert(err.message || 'Αποτυχία έγκρισης διεκδίκησης.'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Λόγος απόρριψης (προαιρετικό):');
    if (reason === null) return;
    try { await personAPI.rejectClaim(id, { reason }); refetch?.(); }
    catch (err) { alert(err.message || 'Αποτυχία απόρριψης διεκδίκησης.'); }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Εκκρεμείς Διεκδικήσεις Προφίλ</h1>
          <Link href="/admin/persons" className="text-sm text-blue-600 hover:underline">← Όλα τα Προφίλ</Link>
        </div>

        {loading && <SkeletonLoader count={5} type="card" />}
        {error && <p className="text-red-500">Αποτυχία φόρτωσης διεκδικήσεων.</p>}

        {!loading && claims.length === 0 && (
          <div className="text-center py-12 text-gray-500">Δεν υπάρχουν εκκρεμείς διεκδικήσεις.</div>
        )}

        {!loading && claims.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Προφίλ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Διεκδικείται από</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Εκλογική Περιφέρεια</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ημ/νία Αιτήματος</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/persons/${profile.slug}`} className="font-medium text-blue-600 hover:underline">{profile.fullName}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{profile.claimedBy?.username || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{profile.constituency?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{profile.claimRequestedAt ? new Date(profile.claimRequestedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApprove(profile.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Έγκριση">
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleReject(profile.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Απόρριψη">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        <Link href={`/admin/persons/claims/${profile.id}`} className="text-xs text-blue-600 hover:underline">Προβολή</Link>
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
              onPrevious={() => setPage((p) => Math.max(p - 1, 1))}
              onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}
