'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAsyncData } from '@/hooks/useAsyncData';
import { reportAPI, articleAPI, commentAPI } from '@/lib/api';
import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/Pagination';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-700',
  actioned: 'bg-red-100 text-red-800',
};

const CONTENT_TYPES = ['article', 'person', 'poll', 'comment', 'candidate', 'user'];

const ACTION_LABELS = {
  dismiss: 'dismissed',
  action: 'actioned',
  mark_reviewed: 'marked as reviewed',
  reopen: 're-opened',
  update_notes: 'notes updated',
};

function ReportsContent() {
  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const { data: reports, loading, error, refetch } = useAsyncData(
    async () => {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (contentTypeFilter) params.contentType = contentTypeFilter;
      const res = await reportAPI.getAll(params);
      if (res.success) {
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages);
        return res.data.reports || [];
      }
      return [];
    },
    [statusFilter, contentTypeFilter, page],
    { initialData: [] }
  );

  const handleReview = async (action) => {
    if (!selectedReport) return;
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const res = await reportAPI.review(selectedReport.id, { action, adminNotes });
      if (res.success) {
        setReviewSuccess(`Report ${ACTION_LABELS[action] || action} successfully.`);
        setSelectedReport(res.data.report);
        refetch();
      } else {
        setReviewError(res.message || 'Review failed.');
      }
    } catch {
      setReviewError('Review failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedReport) return;
    const { contentType, contentId } = selectedReport;
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      let deleteRes;
      if (contentType === 'article') {
        deleteRes = await articleAPI.delete(contentId);
      } else if (contentType === 'comment') {
        deleteRes = await commentAPI.deleteComment(contentId);
      } else {
        setReviewError('Delete not supported for this content type.');
        setReviewLoading(false);
        return;
      }
      if (deleteRes && deleteRes.success === false) {
        setReviewError(deleteRes.message || 'Failed to delete content.');
        setReviewLoading(false);
        return;
      }
      // Auto-action the report after deleting content
      const res = await reportAPI.review(selectedReport.id, { action: 'action', adminNotes });
      if (res.success) {
        setReviewSuccess('Content deleted and report actioned successfully.');
        setSelectedReport(res.data.report);
        refetch();
      } else {
        setReviewError(res.message || 'Content deleted but failed to action report.');
      }
    } catch {
      setReviewError('Failed to delete content.');
    } finally {
      setReviewLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'contentType', label: 'Content Type' },
    {
      key: 'contentId',
      label: 'Content ID',
      render: (row) => {
        const urlMap = {
          article: `/articles/${row.contentId}`,
          person: `/persons/${row.contentId}`,
          poll: `/polls/${row.contentId}`,
          candidate: `/persons/${row.contentId}`,
          user: `/users/${row.contentId}`,
        };
        const url = urlMap[row.contentType];
        return url ? (
          <Link href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {row.contentId}
          </Link>
        ) : (
          <span>{row.contentId}</span>
        );
      }
    },
    { key: 'category', label: 'Category', render: (row) => row.category.replace(/_/g, ' ') },
    {
      key: 'reporter',
      label: 'Reporter',
      render: (row) => row.reporter?.username || row.reporterName || 'Anonymous'
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>
          {row.status}
        </span>
      )
    },
    { key: 'createdAt', label: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ];

  const isFinalized = selectedReport && (selectedReport.status === 'dismissed' || selectedReport.status === 'actioned');
  const isPendingOrReviewed = selectedReport && (selectedReport.status === 'pending' || selectedReport.status === 'reviewed');

  const contentUrl = selectedReport && {
    article: `/articles/${selectedReport.contentId}`,
    person: `/persons/${selectedReport.contentId}`,
    poll: `/polls/${selectedReport.contentId}`,
    candidate: `/persons/${selectedReport.contentId}`,
    user: `/users/${selectedReport.contentId}`,
  }[selectedReport.contentType];

  const canDeleteContent = selectedReport && (selectedReport.contentType === 'article' || selectedReport.contentType === 'comment');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Content Reports</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="actioned">Actioned</option>
        </select>
        <select
          value={contentTypeFilter}
          onChange={(e) => { setContentTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by content type"
        >
          <option value="">All Content Types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Failed to load reports.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            data={reports}
            onRowClick={(row) => { setSelectedReport(row); setAdminNotes(row.adminNotes || ''); setReviewError(''); setReviewSuccess(''); }}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Detail Panel */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-detail-title">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 id="report-detail-title" className="text-xl font-bold text-gray-900">Report #{selectedReport.id}</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><dt className="font-medium text-gray-500">Content Type</dt><dd>{selectedReport.contentType}</dd></div>
              <div>
                <dt className="font-medium text-gray-500">Content ID</dt>
                <dd>
                  {contentUrl ? (
                    <Link href={contentUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {selectedReport.contentId}
                    </Link>
                  ) : (
                    <span>{selectedReport.contentId}</span>
                  )}
                </dd>
              </div>
              <div><dt className="font-medium text-gray-500">Category</dt><dd>{selectedReport.category?.replace(/_/g, ' ')}</dd></div>
              <div><dt className="font-medium text-gray-500">Status</dt><dd><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedReport.status] || 'bg-gray-100 text-gray-700'}`}>{selectedReport.status}</span></dd></div>
              <div><dt className="font-medium text-gray-500">Reporter</dt><dd>{selectedReport.reporter?.username || selectedReport.reporterName || 'Anonymous'}</dd></div>
              {selectedReport.reporterEmail && <div><dt className="font-medium text-gray-500">Reporter Email</dt><dd>{selectedReport.reporterEmail}</dd></div>}
              {selectedReport.message && <div className="col-span-2"><dt className="font-medium text-gray-500">Message</dt><dd className="mt-1 whitespace-pre-wrap">{selectedReport.message}</dd></div>}
            </dl>

            {/* Go to Content button */}
            {contentUrl && (
              <div className="mb-4">
                <Link
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 font-medium py-2 px-4 rounded-md hover:bg-blue-100 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Go to Content
                </Link>
              </div>
            )}

            {/* Admin Notes — always visible */}
            <div className="border-t pt-4">
              <label htmlFor="reportAdminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes {isFinalized ? '(read-only)' : '(optional)'}
              </label>
              <textarea
                id="reportAdminNotes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                readOnly={isFinalized}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 ${isFinalized ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                placeholder="Internal notes..."
              />

              {reviewError && <div role="alert" className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{reviewError}</div>}
              {reviewSuccess && <div role="status" className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{reviewSuccess}</div>}

              {/* Actions for pending / reviewed */}
              {isPendingOrReviewed && (
                <>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleReview('mark_reviewed')}
                      disabled={reviewLoading}
                      className="flex-1 bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Mark as Reviewed'}
                    </button>
                    <button
                      onClick={() => handleReview('dismiss')}
                      disabled={reviewLoading}
                      className="flex-1 bg-gray-600 text-white font-medium py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Dismiss'}
                    </button>
                    <button
                      onClick={() => handleReview('action')}
                      disabled={reviewLoading}
                      className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Action'}
                    </button>
                  </div>
                  {canDeleteContent && (
                    <div className="mt-3">
                      <button
                        onClick={handleDeleteContent}
                        disabled={reviewLoading}
                        className="w-full bg-orange-600 text-white font-medium py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {reviewLoading ? 'Processing...' : 'Delete Content & Action Report'}
                      </button>
                    </div>
                  )}
                  {selectedReport.contentType === 'user' && (
                    <p className="mt-3 text-xs text-gray-500">User banning is managed via the Users admin panel.</p>
                  )}
                </>
              )}

              {/* Actions for finalized reports */}
              {isFinalized && (
                <div className="mt-2">
                  <button
                    onClick={() => handleReview('reopen')}
                    disabled={reviewLoading}
                    className="w-full bg-yellow-500 text-white font-medium py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {reviewLoading ? 'Processing...' : 'Re-open Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <ReportsContent />
    </ProtectedRoute>
  );
}
