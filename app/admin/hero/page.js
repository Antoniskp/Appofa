'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AlertMessage from '@/components/ui/AlertMessage';
import { heroSettingsAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';

function HeroSettingsContent() {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a2a3a');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    heroSettingsAPI.get()
      .then((res) => {
        if (res?.success) {
          setBackgroundImageUrl(res.data.backgroundImageUrl || '');
          setBackgroundColor(res.data.backgroundColor || '#1a2a3a');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clearMessages = () => { setSuccessMsg(''); setErrorMsg(''); };

  // Sanitize image URL to ensure it's a valid http/https URL before using in DOM
  const safePreviewUrl = useMemo(() => {
    if (!backgroundImageUrl) return null;
    try {
      const url = new URL(backgroundImageUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url.href;
    } catch {
      return null;
    }
  }, [backgroundImageUrl]);

  const handleSave = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await heroSettingsAPI.update({ backgroundImageUrl, backgroundColor });
      if (res?.success) {
        setSuccessMsg(res.message || 'Οι ρυθμίσεις αποθηκεύτηκαν.');
      } else {
        setErrorMsg(res?.message || 'Αποτυχία αποθήκευσης.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearImage = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await heroSettingsAPI.update({ backgroundImageUrl: '', backgroundColor });
      if (res?.success) {
        setBackgroundImageUrl('');
        setSuccessMsg('Η εικόνα φόντου αφαιρέθηκε.');
      } else {
        setErrorMsg(res?.message || 'Αποτυχία αφαίρεσης εικόνας.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Αποτυχία αφαίρεσης εικόνας.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Φόρτωση ρυθμίσεων...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ρυθμίσεις Hero</h1>
          <p className="text-sm text-gray-500 mt-1">
            Διαχειριστείτε το φόντο της κεντρικής ενότητας hero στην αρχική σελίδα.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {successMsg && <AlertMessage tone="success" message={successMsg} />}
          {errorMsg && <AlertMessage tone="error" message={errorMsg} />}

          {/* Background Image URL */}
          <div>
            <label htmlFor="bgImageUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              URL Εικόνας Φόντου
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Αφήστε κενό για να εμφανιστεί μόνο το χρώμα φόντου.
            </p>
            <input
              id="bgImageUrl"
              type="url"
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="https://example.com/hero-image.jpg"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {safePreviewUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
                <img
                  src={safePreviewUrl}
                  alt="Hero background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Fallback Background Color */}
          <div>
            <label htmlFor="bgColor" className="block text-sm font-semibold text-gray-700 mb-1">
              Χρώμα Φόντου (Fallback)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Εμφανίζεται όταν δεν υπάρχει εικόνα ή η εικόνα δεν φορτώνει.
            </p>
            <div className="flex items-center gap-3">
              <input
                id="bgColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-600 font-mono">{backgroundColor}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition"
            >
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
            {backgroundImageUrl && (
              <button
                onClick={handleClearImage}
                disabled={saving}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition"
              >
                Αφαίρεση Εικόνας
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}

export default function AdminHeroPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <HeroSettingsContent />
    </ProtectedRoute>
  );
}
