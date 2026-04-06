'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ui/Modal';
import AdminLayout from '@/components/admin/AdminLayout';

function ClaimBadge({ status }) {
  const labels = {
    unclaimed: 'Μη Διεκδικηθέν',
    pending: 'Σε Αναμονή',
    claimed: 'Διεκδικηθέν',
    rejected: 'Απορρίφθηκε',
  };
  const map = {
    unclaimed: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    claimed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}


export default function AdminPersonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { data: profiles, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await personAPI.getAll({ page, limit: 20 });
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
    router.replace('/');
    return null;
  }

  const handleDelete = async (id) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await personAPI.deleteProfile(deleteTargetId);
      refetch?.();
      addToast('Το προφίλ διαγράφηκε επιτυχώς!', { type: 'success' });
    } catch (err) {
      addToast(err.message || 'Αποτυχία διαγραφής προφίλ.', { type: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <AdminLayout>
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Δημόσια Προφίλ Προσώπων</h1>
          <div className="flex gap-2">
            <Link href="/admin/persons/claims" className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <CheckBadgeIcon className="h-4 w-4" /> Διεκδικήσεις
            </Link>
            <Link href="/admin/persons/create" className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-4 w-4" /> Νέο Προφίλ
            </Link>
          </div>
        </div>

        {loading && <SkeletonLoader count={5} type="card" />}
        {error && <p className="text-red-500">Αποτυχία φόρτωσης προφίλ.</p>}

        {!loading && profiles.length === 0 && (
          <div className="text-center py-12 text-gray-500">Δεν υπάρχουν προφίλ ακόμα.</div>
        )}

        {!loading && profiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Όνομα</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Τοποθεσία</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Εκλογική Περιφέρεια</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Κατάσταση</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Πηγή</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/persons/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {p.firstNameNative} {p.lastNameNative}
                      </Link>
                      <p className="text-xs text-gray-400">/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.location?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.constituency?.name || '—'}</td>
                    <td className="px-4 py-3"><ClaimBadge status={p.claimStatus} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.source}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/persons/${p.id}/edit`} className="p-1.5 text-gray-500 hover:text-blue-600 rounded">
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
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
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
              onPrevious={() => setPage((p) => Math.max(p - 1, 1))}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
    <ConfirmDialog
      isOpen={deleteDialogOpen}
      onClose={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}
      onConfirm={confirmDelete}
      title="Διαγραφή Προφίλ"
      message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το προφίλ; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
      confirmText="Διαγραφή"
      cancelText="Άκυρο"
      variant="danger"
    />
    </AdminLayout>
  );
}
