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
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/components/ToastProvider';
import AdminLayout from '@/components/admin/AdminLayout';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';

function AdminClaimsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

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

  const handleApprove = async () => {
    if (!selectedClaim) return;
    setProcessing(true);
    setActionError('');
    try {
      await personAPI.approveClaim(selectedClaim.id);
      addToast('Η διεκδίκηση εγκρίθηκε επιτυχώς.', { type: 'success' });
      refetch?.();
      setSelectedClaim(null);
    } catch (err) {
      setActionError(err.message || 'Αποτυχία έγκρισης διεκδίκησης.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    setProcessing(true);
    setActionError('');
    try {
      await personAPI.rejectClaim(selectedClaim.id, { reason: rejectReason });
      addToast('Η διεκδίκηση απορρίφθηκε επιτυχώς.', { type: 'success' });
      refetch?.();
      setRejectDialogOpen(false);
      setSelectedClaim(null);
      setRejectReason('');
    } catch (err) {
      setActionError(err.message || 'Αποτυχία απόρριψης διεκδίκησης.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
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
            <div className="overflow-x-auto">
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
                          <button
                            onClick={() => {
                              setSelectedClaim(profile);
                              setActionError('');
                              setApproveDialogOpen(true);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Έγκριση"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClaim(profile);
                              setRejectReason('');
                              setActionError('');
                              setRejectDialogOpen(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Απόρριψη"
                          >
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

        <ConfirmDialog
          isOpen={approveDialogOpen}
          onClose={() => {
            setApproveDialogOpen(false);
            setSelectedClaim(null);
            setActionError('');
          }}
          onConfirm={handleApprove}
          title="Έγκριση διεκδίκησης"
          message={`Να εγκριθεί η διεκδίκηση για το προφίλ "${selectedClaim?.fullName || ''}"?`}
          confirmText={processing ? 'Επεξεργασία...' : 'Έγκριση'}
          cancelText="Άκυρο"
          variant="primary"
        />

        <Modal
          isOpen={rejectDialogOpen}
          onClose={() => {
            if (processing) return;
            setRejectDialogOpen(false);
            setSelectedClaim(null);
            setRejectReason('');
            setActionError('');
          }}
          title="Απόρριψη διεκδίκησης"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedClaim(null);
                  setRejectReason('');
                  setActionError('');
                }}
                disabled={processing}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Άκυρο
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={processing}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {processing ? 'Επεξεργασία...' : 'Απόρριψη'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700 mb-3">
            Συμπληρώστε προαιρετικά έναν λόγο απόρριψης για το προφίλ "{selectedClaim?.fullName || ''}".
          </p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Λόγος απόρριψης (προαιρετικό)"
          />
          {actionError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default function AdminClaimsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminClaimsPageContent />
    </ProtectedRoute>
  );
}
