'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAsyncData } from '@/hooks/useAsyncData';
import { homepageSettingsAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function HomepageSettingsContent() {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [manifestSection, setManifestSection] = useState(DEFAULT_MANIFEST_SECTION);

  const { loading } = useAsyncData(
    () => homepageSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        setManifestSection(res?.data?.manifestSection || DEFAULT_MANIFEST_SECTION);
      },
    }
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await homepageSettingsAPI.update({ manifestSection });
      if (res?.success) {
        addToast('Οι ρυθμίσεις αρχικής σελίδας αποθηκεύτηκαν.', { type: 'success' });
      } else {
        addToast(res?.message || 'Αποτυχία αποθήκευσης ρυθμίσεων.', { type: 'error' });
      }
    } catch {
      addToast('Αποτυχία αποθήκευσης ρυθμίσεων.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader count={6} />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Homepage" />
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Manifest Supporters Section</h2>
          <div className="flex items-center gap-3">
            <Toggle
              value={!!manifestSection.enabled}
              onChange={(enabled) => setManifestSection((prev) => ({ ...prev, enabled }))}
            />
            <span className="text-sm text-gray-700">{manifestSection.enabled ? 'Ενεργό' : 'Ανενεργό'}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κοινό</label>
            <select
              value={manifestSection.audience || 'all'}
              onChange={(e) => setManifestSection((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Όλοι</option>
              <option value="guest">Μόνο επισκέπτες</option>
              <option value="registered">Μόνο εγγεγραμμένοι</option>
            </select>
          </div>
          {manifestSection.audience === 'registered' && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              ℹ️ Με κοινό «Μόνο εγγεγραμμένοι», το Manifest Section δεν εμφανίζεται σε επισκέπτες.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </button>
      </div>
    </div>
  );
}

export default function AdminHomepageSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <HomepageSettingsContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
