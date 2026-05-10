'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAsyncData } from '@/hooks/useAsyncData';
import { newsletterAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { NEWSLETTER_TEMPLATES } from '@/lib/constants/newsletterTemplates';

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

function AdminNewsletterCampaignDetailContent() {
  const params = useParams();
  const campaignId = params?.id;
  const { addToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [schedulingCampaign, setSchedulingCampaign] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const { data, loading, refetch } = useAsyncData(
    async () => {
      const response = await newsletterAPI.adminGetCampaign(campaignId);
      if (!response.success) return null;
      return response.data;
    },
    [campaignId],
    { initialData: null }
  );

  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useAsyncData(
    async () => {
      const response = await newsletterAPI.adminCampaignLogs(campaignId, { limit: 30 });
      if (!response.success) return { logs: [], campaign: null };
      return response.data;
    },
    [campaignId],
    { initialData: { logs: [], campaign: null } }
  );

  const campaign = data?.campaign;
  const estimatedRecipients = data?.estimatedRecipients || 0;
  const audienceSummary = data?.audienceSummary || {};
  const canEdit = campaign?.status === 'draft' || campaign?.status === 'scheduled';
  const logs = logsData?.logs || [];

  const formState = useMemo(() => ({
    subject: campaign?.subject || '',
    previewText: campaign?.previewText || '',
    htmlContent: campaign?.htmlContent || '',
    textContent: campaign?.textContent || '',
    scheduledAt: campaign?.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
    status: campaign?.audienceFilters?.status || 'subscribed',
    locale: campaign?.audienceFilters?.locale || '',
    source: campaign?.audienceFilters?.source || '',
    tags: Array.isArray(campaign?.audienceFilters?.tags) ? campaign.audienceFilters.tags.join(', ') : '',
    subscribedFrom: campaign?.audienceFilters?.subscribedFrom ? new Date(campaign.audienceFilters.subscribedFrom).toISOString().slice(0, 10) : '',
    subscribedTo: campaign?.audienceFilters?.subscribedTo ? new Date(campaign.audienceFilters.subscribedTo).toISOString().slice(0, 10) : '',
    createdFrom: campaign?.audienceFilters?.createdFrom ? new Date(campaign.audienceFilters.createdFrom).toISOString().slice(0, 10) : '',
    createdTo: campaign?.audienceFilters?.createdTo ? new Date(campaign.audienceFilters.createdTo).toISOString().slice(0, 10) : '',
  }), [campaign]);

  const [form, setForm] = useState(formState);
  useEffect(() => {
    setForm(formState);
  }, [formState]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);

    try {
      await newsletterAPI.adminUpdateCampaign(campaignId, {
        subject: form.subject,
        ...(form.previewText ? { previewText: form.previewText } : {}),
        htmlContent: form.htmlContent,
        ...(form.textContent ? { textContent: form.textContent } : {}),
        ...(form.scheduledAt ? { scheduledAt: form.scheduledAt } : { scheduledAt: null }),
        audienceFilters: {
          ...(form.status ? { status: form.status } : {}),
          ...(form.locale ? { locale: form.locale } : {}),
          ...(form.source ? { source: form.source } : {}),
          ...(form.tags ? { tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean) } : {}),
          ...(form.subscribedFrom ? { subscribedFrom: form.subscribedFrom } : {}),
          ...(form.subscribedTo ? { subscribedTo: form.subscribedTo } : {}),
          ...(form.createdFrom ? { createdFrom: form.createdFrom } : {}),
          ...(form.createdTo ? { createdTo: form.createdTo } : {}),
        },
      });
      addToast('Campaign updated.', { type: 'success' });
      await refetch();
    } catch (error) {
      addToast(error.message || 'Failed to update campaign.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || sendingTest) return;
    setSendingTest(true);
    try {
      await newsletterAPI.adminSendCampaignTest(campaignId, { email: testEmail });
      addToast('Test email sent.', { type: 'success' });
    } catch (error) {
      addToast(error.message || 'Failed to send test email.', { type: 'error' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendNow = async () => {
    if (sendingCampaign) return;
    setSendingCampaign(true);
    try {
      await newsletterAPI.adminSendCampaignNow(campaignId);
      addToast('Campaign sent.', { type: 'success' });
      await Promise.all([refetch(), refetchLogs()]);
    } catch (error) {
      addToast(error.message || 'Failed to send campaign.', { type: 'error' });
    } finally {
      setSendingCampaign(false);
    }
  };

  const handleSchedule = async () => {
    if (!form.scheduledAt || schedulingCampaign) return;
    setSchedulingCampaign(true);
    try {
      await newsletterAPI.adminScheduleCampaign(campaignId, { scheduledAt: form.scheduledAt });
      addToast('Campaign scheduled.', { type: 'success' });
      await refetch();
    } catch (error) {
      addToast(error.message || 'Failed to schedule campaign.', { type: 'error' });
    } finally {
      setSchedulingCampaign(false);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = NEWSLETTER_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      subject: template.subject,
      previewText: template.previewText,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    }));
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-6xl">
          <AdminHeader title="Newsletter Campaign" subtitle={campaign ? campaign.subject : 'Loading…'} />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/admin/newsletter/campaigns" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to campaigns
            </Link>
            {campaign && <CampaignStatusBadge status={campaign.status} />}
          </div>

          {loading || !campaign ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <SkeletonLoader count={8} type="text" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                    <select
                      disabled={!canEdit}
                      onChange={(event) => applyTemplate(event.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      defaultValue=""
                    >
                      <option value="">Apply template</option>
                      {NEWSLETTER_TEMPLATES.map((template) => (
                        <option key={template.key} value={template.key}>{template.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      disabled={!canEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preview text</label>
                    <input
                      type="text"
                      value={form.previewText}
                      disabled={!canEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, previewText: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTML content</label>
                    <textarea
                      value={form.htmlContent}
                      disabled={!canEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, htmlContent: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[220px] font-mono disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text content</label>
                    <textarea
                      value={form.textContent}
                      disabled={!canEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, textContent: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px] disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled at</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      disabled={!canEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Audience filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={form.status}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      >
                        <option value="subscribed">subscribed</option>
                        <option value="pending">pending</option>
                        <option value="unsubscribed">unsubscribed</option>
                      </select>

                      <select
                        value={form.locale}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      >
                        <option value="">All locales</option>
                        <option value="el">el</option>
                        <option value="en">en</option>
                      </select>

                      <select
                        value={form.source}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      >
                        <option value="">All sources</option>
                        <option value="website">website</option>
                        <option value="admin_manual">admin_manual</option>
                        <option value="import">import</option>
                      </select>

                      <input
                        type="text"
                        value={form.tags}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                        placeholder="Tags (comma separated)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                      <input
                        type="date"
                        value={form.subscribedFrom}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, subscribedFrom: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                      <input
                        type="date"
                        value={form.subscribedTo}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, subscribedTo: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                      <input
                        type="date"
                        value={form.createdFrom}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, createdFrom: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                      <input
                        type="date"
                        value={form.createdTo}
                        disabled={!canEdit}
                        onChange={(event) => setForm((prev) => ({ ...prev, createdTo: event.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save draft'}
                    </button>
                  )}
                </form>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Send logs (latest 30)</h2>
                  {logsLoading ? (
                    <SkeletonLoader count={5} type="text" />
                  ) : logs.length === 0 ? (
                    <p className="text-sm text-gray-500">No send logs yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Provider ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Error</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sent at</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {logs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-3 py-2 text-sm text-gray-800">{log.email}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{log.status}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{log.providerMessageId || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{log.errorMessage || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{formatDate(log.sentAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Delivery summary</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Estimated recipients</dt><dd className="font-medium text-gray-900">{estimatedRecipients}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Audience subscribed</dt><dd className="font-medium text-gray-900">{audienceSummary.subscribed || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Audience pending</dt><dd className="font-medium text-gray-900">{audienceSummary.pending || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Audience unsubscribed</dt><dd className="font-medium text-gray-900">{audienceSummary.unsubscribed || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Total recipients</dt><dd className="font-medium text-gray-900">{campaign.totalRecipients || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Sent</dt><dd className="font-medium text-emerald-700">{campaign.successCount || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Failed</dt><dd className="font-medium text-red-700">{campaign.failureCount || 0}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Sent at</dt><dd className="font-medium text-gray-900">{formatDate(campaign.sentAt)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Scheduled at</dt><dd className="font-medium text-gray-900">{formatDate(campaign.scheduledAt)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-900">{formatDate(campaign.createdAt)}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-gray-500">Updated</dt><dd className="font-medium text-gray-900">{formatDate(campaign.updatedAt)}</dd></div>
                  </dl>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900">Send test email</h2>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    placeholder="test@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest || !testEmail}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
                  >
                    {sendingTest ? 'Sending test…' : 'Send test email'}
                  </button>
                </div>

                {canEdit && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <button
                      type="button"
                      onClick={handleSchedule}
                      disabled={schedulingCampaign || !form.scheduledAt}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
                    >
                      {schedulingCampaign ? 'Scheduling…' : 'Schedule campaign'}
                    </button>
                  </div>
                )}

                {(campaign.status === 'draft' || campaign.status === 'failed' || campaign.status === 'scheduled') && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <button
                      type="button"
                      onClick={handleSendNow}
                      disabled={sendingCampaign}
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                      {sendingCampaign ? 'Sending…' : 'Send campaign now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminNewsletterCampaignDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminNewsletterCampaignDetailContent />
    </ProtectedRoute>
  );
}
