'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { StatsCard } from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { newsletterAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { EnvelopeIcon, UserMinusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

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

function AdminNewsletterContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [locale, setLocale] = useState('');
  const [tag, setTag] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [page, setPage] = useState(1);

  const [addForm, setAddForm] = useState({
    email: '',
    name: '',
    locale: '',
    tags: '',
    notes: '',
    status: 'subscribed',
  });
  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState('subscribed');
  const [csvText, setCsvText] = useState('');
  const [csvDefaultSource, setCsvDefaultSource] = useState('import');
  const [csvDefaultStatus, setCsvDefaultStatus] = useState('subscribed');
  const [csvFileName, setCsvFileName] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const queryParams = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(locale ? { locale } : {}),
    ...(tag ? { tag } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  }), [page, search, status, source, locale, tag, createdFrom, createdTo]);

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useAsyncData(
    async () => {
      const response = await newsletterAPI.adminStats();
      return response.success ? response.data : { total: 0, byStatus: {} };
    },
    [],
    { initialData: { total: 0, byStatus: {} } }
  );

  const { data: listData, loading: listLoading, refetch: refetchList } = useAsyncData(
    async () => {
      const response = await newsletterAPI.adminListSubscribers(queryParams);
      return response.success
        ? response.data
        : { subscribers: [], pagination: { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 } };
    },
    [queryParams],
    { initialData: { subscribers: [], pagination: { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 } } }
  );

  const stats = statsData || { total: 0, byStatus: {} };
  const subscribers = listData?.subscribers || [];
  const pagination = listData?.pagination || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  const canWrite = user?.role === 'admin';

  const refreshAll = async () => {
    await Promise.all([refetchStats(), refetchList()]);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleAddSubscriber = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    try {
      await newsletterAPI.adminAddSubscriber({
        email: addForm.email,
        name: addForm.name || undefined,
        locale: addForm.locale || undefined,
        tags: addForm.tags ? addForm.tags.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
        notes: addForm.notes || undefined,
        status: addForm.status,
      });
      addToast('Subscriber saved successfully.', { type: 'success' });
      setAddForm({ email: '', name: '', locale: '', tags: '', notes: '', status: 'subscribed' });
      await refreshAll();
    } catch (error) {
      addToast(error.message || 'Failed to save subscriber.', { type: 'error' });
    }
  };

  const handleBulkAdd = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    try {
      const response = await newsletterAPI.adminBulkAddSubscribers({
        emailsText: bulkText,
        status: bulkStatus,
      });
      const data = response?.data || {};
      addToast(`Bulk import completed. Added: ${data.added || 0}, Updated: ${data.updated || 0}`, { type: 'success' });
      setBulkText('');
      await refreshAll();
    } catch (error) {
      addToast(error.message || 'Bulk import failed.', { type: 'error' });
    }
  };

  const handleCsvFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setCsvText(text);
      setCsvFileName(file.name);
    } catch {
      addToast('Failed to read CSV file.', { type: 'error' });
    }
  };

  const handleCsvImport = async (event) => {
    event.preventDefault();
    if (!canWrite || importingCsv || !csvText.trim()) return;
    setImportingCsv(true);
    try {
      const response = await newsletterAPI.adminImportSubscribersCsv({
        csvText,
        defaultSource: csvDefaultSource,
        defaultStatus: csvDefaultStatus,
      });
      const summary = response?.data || {};
      addToast(
        `CSV import completed. Created: ${summary.created || 0}, Updated: ${summary.updated || 0}, Skipped: ${summary.skipped || 0}, Invalid: ${(summary.invalid || []).length}`,
        { type: 'success' }
      );
      await refreshAll();
    } catch (error) {
      addToast(error.message || 'CSV import failed.', { type: 'error' });
    } finally {
      setImportingCsv(false);
    }
  };

  const handleCsvExport = async () => {
    if (!canWrite || exportingCsv) return;
    setExportingCsv(true);
    try {
      const csv = await newsletterAPI.adminExportSubscribersCsv(queryParams);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.setAttribute('download', `newsletter-subscribers-${stamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('CSV export generated.', { type: 'success' });
    } catch (error) {
      addToast(error.message || 'CSV export failed.', { type: 'error' });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleQuickStatusUpdate = async (subscriber, nextStatus) => {
    if (!canWrite) return;
    setUpdatingId(subscriber.id);
    try {
      await newsletterAPI.adminUpdateSubscriber(subscriber.id, { status: nextStatus });
      addToast('Subscriber updated.', { type: 'success' });
      await refreshAll();
    } catch (error) {
      addToast(error.message || 'Failed to update subscriber.', { type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-7xl">
          <AdminHeader title="Newsletter" subtitle={`${pagination.total || 0} subscribers`} />

          {canWrite && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link
                href="/admin/newsletter/campaigns"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Manage campaigns
              </Link>
            </div>
          )}

          {statsLoading ? (
            <SkeletonLoader count={3} type="card" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard title="Total" value={stats.total || 0} icon={EnvelopeIcon} />
              <StatsCard title="Subscribed" value={stats.byStatus?.subscribed || 0} icon={CheckBadgeIcon} />
              <StatsCard title="Pending" value={stats.byStatus?.pending || 0} icon={EnvelopeIcon} />
              <StatsCard title="Unsubscribed" value={stats.byStatus?.unsubscribed || 0} icon={UserMinusIcon} />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-search">Search</label>
                <input
                  id="newsletter-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Email or name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-status-filter">Status</label>
                <select
                  id="newsletter-status-filter"
                  value={status}
                  onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="subscribed">Subscribed</option>
                  <option value="pending">Pending</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-source-filter">Source</label>
                <select
                  id="newsletter-source-filter"
                  value={source}
                  onChange={(event) => { setSource(event.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="website">Website</option>
                  <option value="admin_manual">Admin manual</option>
                  <option value="import">Import</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-locale-filter">Locale</label>
                <input
                  id="newsletter-locale-filter"
                  value={locale}
                  onChange={(event) => { setLocale(event.target.value); setPage(1); }}
                  placeholder="el / en"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-tag-filter">Tag</label>
                <input
                  id="newsletter-tag-filter"
                  value={tag}
                  onChange={(event) => { setTag(event.target.value); setPage(1); }}
                  placeholder="e.g. news"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-created-from">Created from</label>
                <input
                  id="newsletter-created-from"
                  type="date"
                  value={createdFrom}
                  onChange={(event) => { setCreatedFrom(event.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="newsletter-created-to">Created to</label>
                <input
                  id="newsletter-created-to"
                  type="date"
                  value={createdTo}
                  onChange={(event) => { setCreatedTo(event.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                Search
              </button>
              {canWrite && (
                <button
                  type="button"
                  onClick={handleCsvExport}
                  disabled={exportingCsv}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
                >
                  {exportingCsv ? 'Exporting…' : 'Export CSV'}
                </button>
              )}
            </form>
          </div>

          {canWrite && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Add subscriber</h2>
                <form onSubmit={handleAddSubscriber} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Name (optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addForm.locale}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, locale: event.target.value }))}
                      placeholder="Locale (el/en)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <select
                      value={addForm.status}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, status: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="subscribed">Subscribed</option>
                      <option value="pending">Pending</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={addForm.tags}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="Tags (comma separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <textarea
                    value={addForm.notes}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Admin notes (optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[88px]"
                  />
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                    Save subscriber
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Bulk add (paste emails)</h2>
                <form onSubmit={handleBulkAdd} className="space-y-3">
                  <textarea
                    value={bulkText}
                    onChange={(event) => setBulkText(event.target.value)}
                    placeholder="name@example.com, second@example.com or one email per line"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[140px]"
                    required
                  />
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="subscribed">Subscribed</option>
                    <option value="pending">Pending</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    Import emails
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">CSV import</h2>
                <p className="text-xs text-gray-500 mb-3">Supported columns: email, name, locale, tags, source, notes, status</p>
                <form onSubmit={handleCsvImport} className="space-y-3">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileSelected}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {csvFileName ? <p className="text-xs text-gray-500">Loaded: {csvFileName}</p> : null}
                  <textarea
                    value={csvText}
                    onChange={(event) => setCsvText(event.target.value)}
                    placeholder="Paste CSV content here if you prefer manual paste."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[140px] font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={csvDefaultSource}
                      onChange={(event) => setCsvDefaultSource(event.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="import">default source: import</option>
                      <option value="admin_manual">default source: admin_manual</option>
                      <option value="website">default source: website</option>
                    </select>
                    <select
                      value={csvDefaultStatus}
                      onChange={(event) => setCsvDefaultStatus(event.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="subscribed">default status: subscribed</option>
                      <option value="pending">default status: pending</option>
                      <option value="unsubscribed">default status: unsubscribed</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={importingCsv || !csvText.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {importingCsv ? 'Importing…' : 'Import CSV'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {listLoading ? (
              <div className="p-4">
                <SkeletonLoader count={6} type="text" />
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No subscribers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Locale</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Subscribed</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{subscriber.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subscriber.name || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            subscriber.status === 'subscribed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : subscriber.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {subscriber.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subscriber.source}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subscriber.locale || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{Array.isArray(subscriber.tags) && subscriber.tags.length > 0 ? subscriber.tags.join(', ') : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(subscriber.subscribedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {canWrite ? (
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                disabled={updatingId === subscriber.id}
                                onClick={() => handleQuickStatusUpdate(
                                  subscriber,
                                  subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed'
                                )}
                                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                              >
                                {subscriber.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Read only</span>
                          )}
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

export default function AdminNewsletterPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminNewsletterContent />
    </ProtectedRoute>
  );
}
