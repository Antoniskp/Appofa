'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/ui/Pagination';
import { useAsyncData } from '@/hooks/useAsyncData';
import { candidateRegistrationAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { POSITION_TYPE_LABELS } from '@/components/locations/LocationCandidatesTab';

const STATUS_OPTIONS = ['submitted', 'approved', 'rejected', 'archived', 'all'];

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-700',
};

function getCandidateName(candidate) {
  if (!candidate) return 'Unknown candidate';
  return [candidate.firstNameNative, candidate.lastNameNative].filter(Boolean).join(' ').trim()
    || [candidate.firstNameEn, candidate.lastNameEn].filter(Boolean).join(' ').trim()
    || candidate.nickname
    || candidate.username
    || `User #${candidate.id}`;
}

function getProfileHref(candidate) {
  if (!candidate) return null;
  if (candidate.slug) return `/persons/${candidate.slug}`;
  if (candidate.username) return `/users/${candidate.username}`;
  return `/users/${candidate.id}`;
}

function AdminCandidatesContent() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [status, setStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const { data: registrations, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await candidateRegistrationAPI.getAll({ status, page, limit: 20, includeDescendants: false });
      if (res.success) {
        setTotalPages(res.data?.pagination?.totalPages || 1);
        return res.data?.registrations || [];
      }
      return [];
    },
    [status, page],
    { initialData: [] }
  );

  const updateStatus = async (registration, nextStatus) => {
    setProcessingId(registration.id);
    try {
      await candidateRegistrationAPI.update(registration.id, { status: nextStatus });
      toastSuccess(`Candidate registration ${nextStatus}.`);
      if (selected?.id === registration.id) {
        setSelected((prev) => prev ? { ...prev, status: nextStatus } : prev);
      }
      refetch();
    } catch (err) {
      toastError(err.message || 'Could not update candidate registration.');
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    {
      key: 'candidate',
      label: 'Candidate',
      render: (row) => {
        const href = getProfileHref(row.candidate);
        const name = getCandidateName(row.candidate);
        return href ? (
          <Link href={href} className="font-medium text-blue-700 hover:underline">
            {name}
          </Link>
        ) : name;
      },
    },
    {
      key: 'positionType',
      label: 'Position',
      render: (row) => row.positionTitle || POSITION_TYPE_LABELS[row.positionType] || row.positionType,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => row.location ? (
        <Link href={`/locations/${row.location.slug || row.location.id}`} className="text-blue-700 hover:underline">
          {row.location.name_local || row.location.name}
        </Link>
      ) : '-',
    },
    {
      key: 'party',
      label: 'Party',
      render: (row) => row.isIndependent ? 'Independent' : (row.partyName || '-'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-700'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Review',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              updateStatus(row, 'approved');
            }}
            disabled={processingId === row.id || row.status === 'approved'}
            className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              updateStatus(row, 'rejected');
            }}
            disabled={processingId === row.id || row.status === 'rejected'}
            className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              updateStatus(row, 'archived');
            }}
            disabled={processingId === row.id || row.status === 'archived'}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidate Registrations</h1>
            <p className="mt-1 text-sm text-gray-600">Review self-declared campaign listings before they appear on location pages.</p>
          </div>
          <Link href="/candidates/register" className="rounded border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
            New registration
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load candidate registrations.
          </div>
        )}

        <AdminTable
          columns={columns}
          data={registrations}
          loading={loading}
          emptyMessage="No candidate registrations found."
          onRowClick={(row) => setSelected(row)}
          actions={false}
        />

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getCandidateName(selected.candidate)}</h2>
                  <p className="text-sm text-gray-500">
                    {selected.positionTitle || POSITION_TYPE_LABELS[selected.positionType] || selected.positionType}
                    {selected.location ? ` · ${selected.location.name_local || selected.location.name}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  X
                </button>
              </div>

              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">{selected.status}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Election cycle</dt>
                  <dd className="mt-1">{selected.electionCycle || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Party</dt>
                  <dd className="mt-1">{selected.isIndependent ? 'Independent' : (selected.partyName || '-')}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Contact</dt>
                  <dd className="mt-1">{selected.contactEmail || '-'}</dd>
                </div>
                {selected.websiteUrl && (
                  <div className="md:col-span-2">
                    <dt className="font-medium text-gray-500">Website</dt>
                    <dd className="mt-1">
                      <a href={selected.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                        {selected.websiteUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {selected.slogan && (
                  <div className="md:col-span-2">
                    <dt className="font-medium text-gray-500">Slogan</dt>
                    <dd className="mt-1 font-medium text-gray-900">{selected.slogan}</dd>
                  </div>
                )}
                {selected.platform && (
                  <div className="md:col-span-2">
                    <dt className="font-medium text-gray-500">Platform</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-gray-700">{selected.platform}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => updateStatus(selected, 'approved')}
                  disabled={processingId === selected.id || selected.status === 'approved'}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selected, 'rejected')}
                  disabled={processingId === selected.id || selected.status === 'rejected'}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selected, 'archived')}
                  disabled={processingId === selected.id || selected.status === 'archived'}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminCandidatesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminCandidatesContent />
    </ProtectedRoute>
  );
}
