'use client';

import { useAdminQueryState } from '@/hooks/useAdminQueryState';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import Modal from '@/components/ui/Modal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAsyncData } from '@/hooks/useAsyncData';
import { reportAPI, articleAPI, commentAPI } from '@/lib/api';
import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/ui/Pagination';
import AdminLayout from '@/components/admin/AdminLayout';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-700',
  actioned: 'bg-red-100 text-red-800',
};

const CONTENT_TYPES = ['article', 'person', 'poll', 'comment', 'candidate', 'user'];


function ReportsContent() {
  const t = useTranslations('adminReports');
  const tw = useTranslations('adminWorkspace');
  const format = useFormatter();
  const [order, setOrder] = useAdminQueryState('order', 'asc', ['asc', 'desc']);
  const [reportId, setReportId] = useAdminQueryState('report', '');
  const [statusFilter, setStatusFilter] = useAdminQueryState('status', '');
  const [contentTypeFilter, setContentTypeFilter] = useAdminQueryState('type', '');
  const [page, setPage] = useAdminQueryState('page', 1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const { data: reports, loading, error, refetch } = useAsyncData(
    async () => {
      const params = { page, limit: 20, order };
      if (statusFilter) params.status = statusFilter;
      if (contentTypeFilter) params.contentType = contentTypeFilter;
      const res = await reportAPI.getAll(params);
      if (res.success) {
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages);
        return res.data.reports || [];
      }
      throw new Error(t('loadFailed'));
    },
    [statusFilter, contentTypeFilter, page, order],
    { initialData: [] }
  );

  useEffect(() => {
    let cancelled = false;
    if (!reportId || !/^\d+$/.test(reportId)) { setSelectedReport(null); return undefined; }
    setReviewError('');
    setReviewSuccess('');
    reportAPI.getById(reportId).then((res) => {
      if (cancelled) return;
      if (!res.success) throw new Error('Unavailable');
      setSelectedReport(res.data.report);
      setAdminNotes(res.data.report.adminNotes || '');
    }).catch(() => { if (!cancelled) setReviewError(t('loadFailed')); });
    return () => { cancelled = true; };
  }, [reportId, t]);

  const preview = useAsyncData(async () => {
    if (selectedReport?.contentType !== 'article') return null;
    const response = await articleAPI.getById(selectedReport.contentId);
    if (!response.success) throw new Error('Unavailable');
    return response.data.article;
  }, [selectedReport?.contentType, selectedReport?.contentId], { initialData: null });

  const reviewNext = async () => {
    setReviewLoading(true);
    setReviewError('');
    try {
      const response = await reportAPI.getAll({ status: 'pending', ...(contentTypeFilter ? { contentType: contentTypeFilter } : {}), page: 1, limit: 2, order: 'asc' });
      if (!response.success) throw new Error('Unavailable');
      const next = response.data.reports.find((report) => report.id !== selectedReport?.id);
      if (next) { setSelectedReport(null); setReportId(String(next.id)); }
      else setReviewSuccess(tw('queueClear'));
    } catch { setReviewError(t('loadFailed')); }
    finally { setReviewLoading(false); }
  };

  const handleReview = async (action) => {
    if (!selectedReport) return;
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const res = await reportAPI.review(selectedReport.id, { action, adminNotes });
      if (res.success) {
        setReviewSuccess(t('updated'));
        setSelectedReport(res.data.report);
        refetch();
      } else {
        setReviewError(res.message || t('reviewFailed'));
      }
    } catch {
      setReviewError(t('reviewFailed'));
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
        setReviewError(t('deleteUnsupported'));
        setReviewLoading(false);
        return;
      }
      if (deleteRes && deleteRes.success === false) {
        setReviewError(deleteRes.message || t('deleteFailed'));
        setReviewLoading(false);
        return;
      }
      // Auto-action the report after deleting content
      const res = await reportAPI.review(selectedReport.id, { action: 'action', adminNotes });
      if (res.success) {
        setReviewSuccess(t('deleted'));
        setSelectedReport(res.data.report);
        refetch();
      } else {
        setReviewError(res.message || t('partiallyDeleted'));
      }
    } catch {
      setReviewError(t('deleteFailed'));
    } finally {
      setReviewLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'contentType', label: t('contentType'), render: (row) => t(`types.${row.contentType}`) },
    {
      key: 'contentId',
      label: t('contentId'),
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
    { key: 'category', label: t('category'), render: (row) => row.category ? t(`categories.${row.category}`) : '—' },
    {
      key: 'reporter',
      label: t('reporter'),
      render: (row) => row.reporter?.username || row.reporterName || t('anonymous')
    },
    {
      key: 'status',
      label: t('status'),
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>
          {t(`statuses.${row.status}`)}
        </span>
      )
    },
    { key: 'createdAt', label: t('date'), render: (row) => format.relativeTime(new Date(row.createdAt)) },
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
    <AdminLayout>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {reviewError && !selectedReport && <p role="alert" className="text-red-700">{reviewError}</p>}
      {reportId && !selectedReport && !reviewError && <p role="status">{tw('loading')}</p>}
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select aria-label={t('sort')} value={order} onChange={(e) => setOrder(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
          <option value="asc">{t('oldestFirst')}</option><option value="desc">{t('newestFirst')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('statusFilter')}
        >
          <option value="">{t('allStatuses')}</option>
          <option value="pending">{t('statuses.pending')}</option>
          <option value="reviewed">{t('statuses.reviewed')}</option>
          <option value="dismissed">{t('statuses.dismissed')}</option>
          <option value="actioned">{t('statuses.actioned')}</option>
        </select>
        <select
          value={contentTypeFilter}
          onChange={(e) => { setContentTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('typeFilter')}
        >
          <option value="">{t('allTypes')}</option>
          {CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>{t(`types.${type}`)}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {t('loadFailed')} <button onClick={refetch} className="underline">{tw('retry')}</button>
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
            emptyMessage={tw('queueClear')}
            columns={columns}
            data={reports}
            onRowClick={(row) => { setSelectedReport(null); setReportId(String(row.id)); setReviewError(''); setReviewSuccess(''); }}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Detail Panel */}
      {selectedReport && (
        <Modal isOpen={Boolean(selectedReport)} onClose={() => { if (!reviewLoading) { setSelectedReport(null); setReportId(''); } }} title={tw('reportNumber', { id: selectedReport.id })} size="lg">
            <p className="text-sm text-gray-500 mb-4">{t('submitted')}: {format.relativeTime(new Date(selectedReport.createdAt))}</p>
            <button onClick={reviewNext} disabled={reviewLoading || adminNotes !== (selectedReport.adminNotes || '')} className="mb-4 text-blue-700 underline disabled:opacity-50">{t('reviewNext')}</button>
            {adminNotes !== (selectedReport.adminNotes || '') && <p className="text-sm text-amber-700">{t('saveNotesFirst')}</p>}
            {selectedReport.contentType === 'article' && <section className="mb-4 rounded border p-3">
              <h3 className="font-semibold">{t('preview')}</h3>
              {preview.loading ? <p>{tw('loading')}</p> : preview.error ? <p>{tw('unavailable')}</p> : <><h4>{preview.data?.title}</h4><p className="whitespace-pre-wrap break-words">{String(preview.data?.content || preview.data?.summary || '').slice(0, 1200)}</p></>}
            </section>}
            <dl className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><dt className="font-medium text-gray-500">{t('contentType')}</dt><dd>{t(`types.${selectedReport.contentType}`)}</dd></div>
              <div>
                <dt className="font-medium text-gray-500">{t('contentId')}</dt>
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
              <div><dt className="font-medium text-gray-500">{t('category')}</dt><dd>{selectedReport.category ? t(`categories.${selectedReport.category}`) : '—'}</dd></div>
              <div><dt className="font-medium text-gray-500">{t('status')}</dt><dd><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedReport.status] || 'bg-gray-100 text-gray-700'}`}>{t(`statuses.${selectedReport.status}`)}</span></dd></div>
              <div><dt className="font-medium text-gray-500">{t('reporter')}</dt><dd>{selectedReport.reporter?.username || selectedReport.reporterName || t('anonymous')}</dd></div>
              {selectedReport.reporterEmail && <div><dt className="font-medium text-gray-500">{t('reporterEmail')}</dt><dd>{selectedReport.reporterEmail}</dd></div>}
              {selectedReport.message && <div className="col-span-2"><dt className="font-medium text-gray-500">{t('message')}</dt><dd className="mt-1 whitespace-pre-wrap">{selectedReport.message}</dd></div>}
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
                  {t('goToContent')}
                </Link>
              </div>
            )}

            {/* Admin Notes — always visible */}
            <div className="border-t pt-4">
              <label htmlFor="reportAdminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                {t('notes')} {isFinalized ? t('readOnly') : t('optional')}
              </label>
              <textarea
                id="reportAdminNotes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                readOnly={isFinalized || reviewLoading}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 ${isFinalized ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                placeholder={t('notesPlaceholder')}
              />

              {reviewError && <div role="alert" className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{reviewError}</div>}
              {reviewSuccess && <div role="status" className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{reviewSuccess}</div>}

              {!isFinalized && <button disabled={reviewLoading || adminNotes === (selectedReport.adminNotes || '')} onClick={() => handleReview('update_notes')} className="mb-3 text-blue-700 underline disabled:opacity-50">{t('saveNotes')}</button>}
              {/* Actions for pending / reviewed */}
              {isPendingOrReviewed && (
                <>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleReview('mark_reviewed')}
                      disabled={reviewLoading}
                      className="flex-1 bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? t('processing') : t('markReviewed')}
                    </button>
                    <button
                      onClick={() => handleReview('dismiss')}
                      disabled={reviewLoading}
                      className="flex-1 bg-gray-600 text-white font-medium py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? t('processing') : t('dismiss')}
                    </button>
                    <button
                      onClick={() => handleReview('action')}
                      disabled={reviewLoading}
                      className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {reviewLoading ? t('processing') : t('action')}
                    </button>
                  </div>
                  {canDeleteContent && (
                    <div className="mt-3">
                      <button
                        onClick={handleDeleteContent}
                        disabled={reviewLoading}
                        className="w-full bg-orange-600 text-white font-medium py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {reviewLoading ? t('processing') : t('deleteContent')}
                      </button>
                    </div>
                  )}
                  {selectedReport.contentType === 'user' && (
                    <p className="mt-3 text-xs text-gray-500">{t('userBanning')}</p>
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
                    {reviewLoading ? t('processing') : t('reopen')}
                  </button>
                </div>
              )}
            </div>
        </Modal>
      )}
    </div>
    </AdminLayout>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <ReportsContent />
    </ProtectedRoute>
  );
}
