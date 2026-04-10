'use client';

import { useState } from 'react';
import { ShieldExclamationIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { listIpRules, addIpRule, removeIpRule, checkIpRule } from '@/lib/api/ipRules';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/components/ToastProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ProtectedRoute from '@/components/ProtectedRoute';

const isValidIp = (ip) => {
  // IPv4: validate each octet is 0-255
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (v4.test(ip)) {
    return ip.split('.').every((octet) => parseInt(octet, 10) <= 255);
  }
  // IPv6 (covers full, compressed, and loopback forms)
  const v6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(:[0-9a-fA-F]{1,4}){1,6}|:(:[0-9a-fA-F]{1,4}){1,7}|::)$/;
  return v6.test(ip);
};

const EMPTY_FORM = { ip: '', type: 'blacklist', reason: '' };

function IpRulesContent() {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [checkIp, setCheckIp] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const { data: rules, loading, refetch } = useAsyncData(
    () => listIpRules(),
    [],
    {
      initialData: [],
      transform: (res) => res?.data || [],
    }
  );

  const filteredRules = typeFilter === 'all'
    ? rules
    : rules.filter((r) => r.type === typeFilter);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValidIp(form.ip.trim())) {
      addToast('Invalid IP address format.', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await addIpRule(form.ip.trim(), form.type, form.reason || null);
      if (res?.success) {
        addToast('IP rule added.', { type: 'success' });
        setShowForm(false);
        setForm(EMPTY_FORM);
        refetch();
      } else {
        addToast(res?.message || 'Failed to add rule.', { type: 'error' });
      }
    } catch (err) {
      addToast(err?.message || 'Failed to add rule.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await removeIpRule(deleteTarget.ip);
      if (res?.success) {
        addToast('IP rule removed.', { type: 'success' });
        setDeleteTarget(null);
        refetch();
      } else {
        addToast(res?.message || 'Failed to remove rule.', { type: 'error' });
      }
    } catch (err) {
      addToast(err?.message || 'Failed to remove rule.', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!checkIp.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await checkIpRule(checkIp.trim());
      if (res?.success) {
        setCheckResult(res);
      } else {
        addToast(res?.message || 'Check failed.', { type: 'error' });
      }
    } catch (err) {
      addToast(err?.message || 'Check failed.', { type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const typeBadge = (type) =>
    type === 'whitelist'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';

  const checkStatusBadge = (status) => {
    if (status === 'whitelist') return 'bg-green-100 text-green-800';
    if (status === 'blacklist') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <AdminHeader
        title="IP Access Rules"
        actionText="Add Rule"
        onAction={() => { setShowForm(true); setForm(EMPTY_FORM); }}
      />

      {/* Add Rule Form */}
      {showForm && (
        <div className="mx-4 mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Add IP Rule</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.ip}
                  onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.1 or ::1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blacklist">Blacklist (block)</option>
                  <option value="whitelist">Whitelist (bypass rate limits)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. abuse, trusted server"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Rule'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Check IP Tool */}
      <div className="mx-4 mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          Check IP Status
        </h2>
        <form onSubmit={handleCheck} className="flex items-center gap-3">
          <input
            type="text"
            value={checkIp}
            onChange={(e) => { setCheckIp(e.target.value); setCheckResult(null); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            placeholder="Enter IP address"
          />
          <button
            type="submit"
            disabled={checking || !checkIp.trim()}
            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
          {checkResult && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${checkStatusBadge(checkResult.status)}`}>
              {checkResult.ip}: {checkResult.status}
            </span>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="mx-4 mb-4 flex gap-2">
        {['all', 'whitelist', 'blacklist'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="mx-4">
        {loading ? (
          <SkeletonLoader type="table" rows={5} />
        ) : filteredRules.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <ShieldExclamationIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No IP rules found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRules.map((rule) => (
                  <tr key={rule.ip} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">{rule.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge(rule.type)}`}>
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{rule.reason || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{rule.createdBy?.username || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(rule)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Remove rule"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove IP Rule"
        message={`Remove rule for IP ${deleteTarget?.ip}? This action cannot be undone.`}
        confirmText={deleting ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
        loading={deleting}
      />
    </div>
  );
}

export default function AdminIpRulesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <IpRulesContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
