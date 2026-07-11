'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { mediaAPI } from '@/lib/api';
import { useTranslations } from 'next-intl';

const LIMIT = 24;

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminMediaPageContent() {
  const t = useTranslations('admin');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [usageType, setUsageType] = useState('');
  const [uploaderId, setUploaderId] = useState('');
  const [orphaned, setOrphaned] = useState('');
  const [referenced, setReferenced] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [metadataForm, setMetadataForm] = useState({ altText: '', caption: '', credit: '', tags: '' });
  const [actionError, setActionError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cleanupReport, setCleanupReport] = useState(null);

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useAsyncData(
    async () => {
      const response = await mediaAPI.getAdminStats();
      return response.stats || null;
    },
    [],
    { initialData: null }
  );

  const { data: listData, loading, refetch } = useAsyncData(
    async () => {
      const response = await mediaAPI.list({
        page,
        limit: LIMIT,
        search: search || undefined,
        usageType: usageType || undefined,
        uploaderId: uploaderId || undefined,
        orphaned: orphaned || undefined,
        referenced: referenced || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      return response;
    },
    [page, search, usageType, uploaderId, orphaned, referenced, dateFrom, dateTo],
    { initialData: { media: [], pagination: { page: 1, totalPages: 1, total: 0 }, quota: null } }
  );

  const selectedAsset = useMemo(
    () => (listData?.media || []).find((item) => item.id === selectedAssetId) || null,
    [listData?.media, selectedAssetId]
  );

  const openAsset = async (assetId) => {
    setActionError('');
    try {
      const response = await mediaAPI.getById(assetId);
      const media = response.media;
      setSelectedAssetId(media.id);
      setMetadataForm({
        altText: media.altText || '',
        caption: media.caption || '',
        credit: media.credit || '',
        tags: Array.isArray(media.tags) ? media.tags.join(', ') : '',
      });
    } catch (error) {
      setActionError(error.message || t('media_load_asset_error'));
    }
  };

  const saveMetadata = async () => {
    if (!selectedAssetId) return;
    setActionError('');
    try {
      await mediaAPI.update(selectedAssetId, metadataForm);
      await refetch();
      await openAsset(selectedAssetId);
    } catch (error) {
      setActionError(error.message || t('media_save_asset_error'));
    }
  };

  const deleteAsset = async () => {
    if (!selectedAssetId) return;
    setActionError('');
    try {
      await mediaAPI.remove(selectedAssetId);
      setDeleteOpen(false);
      setSelectedAssetId(null);
      await refetch();
      await refetchStats();
    } catch (error) {
      setActionError(error.message || t('media_delete_asset_error'));
      setDeleteOpen(false);
    }
  };

  const runCleanupReport = async () => {
    setActionError('');
    try {
      const response = await mediaAPI.getAdminCleanupReport({ olderThanDays: 14 });
      setCleanupReport(response.report || null);
      await refetch();
      await refetchStats();
    } catch (error) {
      setActionError(error.message || t('media_cleanup_report_error'));
    }
  };

  const stats = statsData || {};
  const quotaConfig = stats.quotaConfig || {};
  const uploaders = stats.largestUploaders || [];
  const mediaItems = listData?.media || [];
  const pagination = listData?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container space-y-6">
          <AdminHeader title={t('media_title')} subtitle={t('media_subtitle')} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">{t('media_stats_total_assets')}</p>
              <p className="text-lg font-semibold">{stats.totalAssetCount || 0}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">{t('media_stats_total_storage')}</p>
              <p className="text-lg font-semibold">{formatBytes(stats.totalStoredBytes)}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">{t('media_stats_orphan_assets')}</p>
              <p className="text-lg font-semibold">{stats.orphanedAssetCount || 0}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">{t('media_stats_orphan_storage')}</p>
              <p className="text-lg font-semibold">{formatBytes(stats.orphanedStoredBytes)}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <input className="border rounded px-2 py-2 text-sm" placeholder={t('media_filter_search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <select className="border rounded px-2 py-2 text-sm" value={usageType} onChange={(e) => { setUsageType(e.target.value); setPage(1); }}>
                <option value="">{t('media_filter_all_usage')}</option>
                <option value="shared">shared</option>
                <option value="article_cover">article_cover</option>
                <option value="article_body">article_body</option>
                <option value="avatar">avatar</option>
              </select>
              <select className="border rounded px-2 py-2 text-sm" value={uploaderId} onChange={(e) => { setUploaderId(e.target.value); setPage(1); }}>
                <option value="">{t('media_filter_all_uploaders')}</option>
                {uploaders.map((uploader) => (
                  <option key={uploader.userId} value={uploader.userId}>{uploader.username || `#${uploader.userId}`}</option>
                ))}
              </select>
              <select className="border rounded px-2 py-2 text-sm" value={referenced} onChange={(e) => { setReferenced(e.target.value); setPage(1); }}>
                <option value="">{t('media_filter_reference_any')}</option>
                <option value="true">{t('media_filter_reference_yes')}</option>
              </select>
              <select className="border rounded px-2 py-2 text-sm" value={orphaned} onChange={(e) => { setOrphaned(e.target.value); setPage(1); }}>
                <option value="">{t('media_filter_orphan_any')}</option>
                <option value="true">{t('media_filter_orphan_yes')}</option>
              </select>
              <button type="button" onClick={runCleanupReport} className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-black">
                {t('media_cleanup_report_button')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="border rounded px-2 py-2 text-sm" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <input className="border rounded px-2 py-2 text-sm" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <p className="text-xs text-gray-500">
              {t('media_quota_config', {
                maxFile: formatBytes(quotaConfig.maxFileBytes),
                userQuota: formatBytes(quotaConfig.userQuotaBytes),
              })}
            </p>
          </div>

          {actionError ? <AlertMessage message={actionError} /> : null}
          {statsLoading || loading ? <SkeletonLoader type="card" count={3} /> : null}

          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-lg border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">{t('media_col_asset')}</th>
                        <th className="px-3 py-2 text-left">{t('media_col_uploader')}</th>
                        <th className="px-3 py-2 text-left">{t('media_col_usage')}</th>
                        <th className="px-3 py-2 text-left">{t('media_col_size')}</th>
                        <th className="px-3 py-2 text-left">{t('media_col_references')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediaItems.map((asset) => {
                        const thumb = asset.variants?.thumbnail?.url || asset.url;
                        return (
                          <tr
                            key={asset.id}
                            className="border-t hover:bg-gray-50 cursor-pointer"
                            onClick={() => openAsset(asset.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openAsset(asset.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Image src={thumb} alt={asset.altText || `asset-${asset.id}`} width={40} height={40} className="h-10 w-10 rounded object-cover" />
                                <div>
                                  <p className="font-medium">#{asset.id}</p>
                                  <p className="text-xs text-gray-500">{asset.detectedMimeType || asset.mimeType}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">{asset.uploadedBy?.username || '-'}</td>
                            <td className="px-3 py-2">{asset.usageType}</td>
                            <td className="px-3 py-2">{formatBytes(asset.size)}</td>
                            <td className="px-3 py-2">
                              <span className={asset.referenceCount > 0 ? 'text-amber-700' : 'text-green-700'}>
                                {asset.referenceCount || 0}
                              </span>
                              {asset.isOrphaned ? <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">{t('media_orphan_badge')}</span> : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t">
                  <Pagination
                    currentPage={pagination.page || 1}
                    totalPages={pagination.totalPages || 1}
                    onPageChange={setPage}
                    onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4 space-y-3">
                <h3 className="font-semibold">{t('media_details_title')}</h3>
                {!selectedAsset ? <p className="text-sm text-gray-500">{t('media_details_empty')}</p> : (
                  <>
                    <p className="text-xs text-gray-500">#{selectedAsset.id} • {formatBytes(selectedAsset.size)} • {selectedAsset.width || '-'}×{selectedAsset.height || '-'}</p>
                    <input className="border rounded px-2 py-2 text-sm w-full" value={metadataForm.altText} onChange={(e) => setMetadataForm((prev) => ({ ...prev, altText: e.target.value }))} placeholder={t('media_field_alt')} />
                    <input className="border rounded px-2 py-2 text-sm w-full" value={metadataForm.caption} onChange={(e) => setMetadataForm((prev) => ({ ...prev, caption: e.target.value }))} placeholder={t('media_field_caption')} />
                    <input className="border rounded px-2 py-2 text-sm w-full" value={metadataForm.credit} onChange={(e) => setMetadataForm((prev) => ({ ...prev, credit: e.target.value }))} placeholder={t('media_field_credit')} />
                    <input className="border rounded px-2 py-2 text-sm w-full" value={metadataForm.tags} onChange={(e) => setMetadataForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder={t('media_field_tags')} />
                    <button type="button" onClick={saveMetadata} className="w-full rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">{t('media_save_button')}</button>
                    <button type="button" disabled={selectedAsset.referenceCount > 0} onClick={() => setDeleteOpen(true)} className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                      {selectedAsset.referenceCount > 0 ? t('media_delete_blocked') : t('media_delete_button')}
                    </button>
                    {selectedAsset.referenceCount > 0 ? (
                      <p className="text-xs text-amber-700">{t('media_delete_blocked_message', { count: selectedAsset.referenceCount })}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {cleanupReport ? (
            <div className="rounded-lg border bg-white p-4">
              <h4 className="font-semibold mb-2">{t('media_cleanup_report_title')}</h4>
              <p className="text-sm text-gray-600">{t('media_cleanup_report_summary', { total: cleanupReport.cleanup?.candidates?.length || 0 })}</p>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteAsset}
        title={t('media_delete_confirm_title')}
        message={t('media_delete_confirm_message')}
        confirmText={t('media_delete_confirm_button')}
        cancelText={t('media_delete_cancel_button')}
      />
    </AdminLayout>
  );
}

export default function AdminMediaPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminMediaPageContent />
    </ProtectedRoute>
  );
}
