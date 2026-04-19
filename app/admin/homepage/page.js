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
const DEFAULT_INFO_SECTION = {
  enabled: false,
  audience: 'guest',
  bannerText: 'Ψήφισε ελεύθερα · Ανώνυμα',
  subText: 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά',
  experimentalNotice: true,
  quickLinks: [],
  roadmap: [],
  done: [],
};

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

function ArrayListEditor({ title, values, onChange, placeholder = 'Νέα τιμή...' }) {
  const update = (index, value) => {
    onChange(values.map((item, idx) => (idx === index ? value : item)));
  };

  const remove = (index) => {
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{title}</label>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50"
            >
              Αφαίρεση
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
      >
        + Προσθήκη
      </button>
      {values.length === 0 && (
        <p className="text-xs text-gray-500">{placeholder}</p>
      )}
    </div>
  );
}

function HomepageSettingsContent() {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [manifestSection, setManifestSection] = useState(DEFAULT_MANIFEST_SECTION);
  const [infoSection, setInfoSection] = useState(DEFAULT_INFO_SECTION);

  const { loading } = useAsyncData(
    () => homepageSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        setManifestSection(res?.data?.manifestSection || DEFAULT_MANIFEST_SECTION);
        setInfoSection({ ...DEFAULT_INFO_SECTION, ...(res?.data?.infoSection || {}) });
      },
    }
  );

  const updateQuickLink = (index, key, value) => {
    setInfoSection((prev) => ({
      ...prev,
      quickLinks: (prev.quickLinks || []).map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }));
  };

  const removeQuickLink = (index) => {
    setInfoSection((prev) => ({
      ...prev,
      quickLinks: (prev.quickLinks || []).filter((_, idx) => idx !== index),
    }));
  };

  const addQuickLink = () => {
    setInfoSection((prev) => ({
      ...prev,
      quickLinks: [...(prev.quickLinks || []), { icon: '🔗', text: '', href: '' }],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await homepageSettingsAPI.update({ manifestSection, infoSection });
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

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Info Section</h2>
          <div className="flex items-center gap-3">
            <Toggle
              value={!!infoSection.enabled}
              onChange={(enabled) => setInfoSection((prev) => ({ ...prev, enabled }))}
            />
            <span className="text-sm text-gray-700">{infoSection.enabled ? 'Ενεργό' : 'Ανενεργό'}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κοινό</label>
            <select
              value={infoSection.audience || 'guest'}
              onChange={(e) => setInfoSection((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Όλοι</option>
              <option value="guest">Μόνο επισκέπτες</option>
              <option value="registered">Μόνο εγγεγραμμένοι</option>
            </select>
          </div>
          {infoSection.audience === 'guest' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ℹ️ Με κοινό «Μόνο επισκέπτες», το Info Section δεν εμφανίζεται σε συνδεδεμένους χρήστες
              (συμπεριλαμβανομένου του admin). Αλλάξτε σε «Όλοι» για να το δείτε και εσείς.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner text</label>
            <textarea
              rows={3}
              value={infoSection.bannerText || ''}
              onChange={(e) => setInfoSection((prev) => ({ ...prev, bannerText: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub text</label>
            <textarea
              rows={2}
              value={infoSection.subText || ''}
              onChange={(e) => setInfoSection((prev) => ({ ...prev, subText: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Κείμενο σώματος (προαιρετικό)</label>
            <textarea
              rows={5}
              value={infoSection.bodyText || ''}
              onChange={(e) => setInfoSection((prev) => ({ ...prev, bodyText: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Γράψτε εδώ το κύριο κείμενο της ενότητας..."
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!infoSection.experimentalNotice}
              onChange={(e) => setInfoSection((prev) => ({ ...prev, experimentalNotice: e.target.checked }))}
            />
            Εμφάνιση πειραματικής ένδειξης
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Links</label>
            {(infoSection.quickLinks || []).map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={item.icon || ''}
                  onChange={(e) => updateQuickLink(index, 'icon', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Icon"
                />
                <input
                  type="text"
                  value={item.text || ''}
                  onChange={(e) => updateQuickLink(index, 'text', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Text"
                />
                <input
                  type="text"
                  value={item.href || ''}
                  onChange={(e) => updateQuickLink(index, 'href', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Href"
                />
                <button
                  type="button"
                  onClick={() => removeQuickLink(index)}
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50"
                >
                  Αφαίρεση
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addQuickLink}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
            >
              + Προσθήκη quick link
            </button>
          </div>

          <ArrayListEditor
            title="Roadmap"
            values={Array.isArray(infoSection.roadmap) ? infoSection.roadmap : []}
            onChange={(roadmap) => setInfoSection((prev) => ({ ...prev, roadmap }))}
          />
          <ArrayListEditor
            title="Done"
            values={Array.isArray(infoSection.done) ? infoSection.done : []}
            onChange={(done) => setInfoSection((prev) => ({ ...prev, done }))}
          />
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Το Info Section μπορεί να έχει κλειστεί από επισκέπτες μέσω του κουμπιού «Απόκρυψη». Πατήστε παρακάτω για να το επαναφέρετε στον τρέχοντα browser σας.
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('infoBannerDismissed');
                  addToast('Το Info Section θα εμφανιστεί ξανά στην αρχική σελίδα.', { type: 'success' });
                }
              }}
              className="px-3 py-2 rounded-lg border border-amber-300 text-amber-800 text-sm hover:bg-amber-50 transition"
            >
              🔁 Επαναφορά εμφάνισης Info Section
            </button>
          </div>
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
