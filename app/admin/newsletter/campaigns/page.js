'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Pagination from '@/components/ui/Pagination';
import { useAsyncData } from '@/hooks/useAsyncData';
import { newsletterAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function audienceLabel(filters = {}) {
  const parts = [filters.status ? `status: ${filters.status}` : 'status: subscribed'];
  if (filters.locale) parts.push(`locale: ${filters.locale}`);
  if (filters.source) parts.push(`source: ${filters.source}`);
  if (Array.isArray(filters.tags) && filters.tags.length > 0) parts.push(`tags: ${filters.tags.join(', ')}`);
  if (filters.subscribedFrom) parts.push(`subscribed from: ${new Date(filters.subscribedFrom).toLocaleDateString('el-GR')}`);
  if (filters.subscribedTo) parts.push(`subscribed to: ${new Date(filters.subscribedTo).toLocaleDateString('el-GR')}`);
  return parts.join(' · ');
}

function CampaignStatusBadge({ status }) {
  const classes = status === 'sent'
    ? 'bg-emerald-100 text-emerald-700'
      : status === 'sending'
        ? 'bg-blue-100 text-blue-700'
        : status === 'scheduled'
          ? 'bg-violet-100 text-violet-700'
        : status === 'failed'
          ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function AdminNewsletterCampaignsContent() {
  const { addToast } = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
  }), [page, status]);

  const { data, loading, refetch } = useAsyncData(
    async () => {
      const response = await newsletterAPI.adminListCampaigns(queryParams);
      return response.success
        ? response.data
        : { campaigns: [], pagination: { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 } };
    },
    [queryParams],
    { initialData: { campaigns: [], pagination: { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 } } }
  );

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };

  const handleSendNow = async (campaign) => {
    if (!['draft', 'failed', 'scheduled'].includes(campaign.status)) return;
    try {
      await newsletterAPI.adminSendCampaignNow(campaign.id);
      addToast('Campaign sent successfully.', { type: 'success' });
      await refetch();
    } catch (error) {
      addToast(error.message || 'Failed to send campaign.', { type: 'error' });
    }
  };

  const handleProcessDue = async () => {
    try {
      const response = await newsletterAPI.adminProcessDueCampaigns();
      const data = response?.data || {};
      addToast(`Processed due campaigns. Sent: ${data.processed || 0}, Failed: ${data.failed || 0}`, { type: 'success' });
      await refetch();
    } catch (error) {
      addToast(error.message || 'Failed to process due campaigns.', { type: 'error' });
    }
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-7xl">
          <AdminHeader title="Newsletter Campaigns" subtitle={`${pagination.total || 0} campaigns`} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="campaign-status-filter">Status</label>
              <select
                id="campaign-status-filter"
                value={status}
                onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/newsletter"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100"
              >
                Subscribers
              </Link>
              <Link
                href="/admin/newsletter/campaigns/new"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                New campaign
              </Link>
              <button
                type="button"
                onClick={handleProcessDue}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100"
              >
                Process due
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-4">
                <SkeletonLoader count={6} type="text" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No campaigns found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Audience</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Results</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sent at</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled at</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{campaign.subject}</div>
                          <div className="text-xs text-gray-500">#{campaign.id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm"><CampaignStatusBadge status={campaign.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-700">{audienceLabel(campaign.audienceFilters || {})}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>Total: {campaign.totalRecipients || 0}</div>
                          <div>Sent: {campaign.successCount || 0}</div>
                          <div>Failed: {campaign.failureCount || 0}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(campaign.sentAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(campaign.scheduledAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <Link
                              href={`/admin/newsletter/campaigns/${campaign.id}`}
                              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                            >
                              Open
                            </Link>
                            {['draft', 'failed', 'scheduled'].includes(campaign.status) && (
                              <button
                                type="button"
                                onClick={() => handleSendNow(campaign)}
                                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Send now
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
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={pagination.page || 1}
              totalPages={pagination.totalPages || 1}
              onPageChange={setPage}
              onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setPage((prev) => Math.min(pagination.totalPages || 1, prev + 1))}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminNewsletterCampaignsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminNewsletterCampaignsContent />
    </ProtectedRoute>
  );
}
