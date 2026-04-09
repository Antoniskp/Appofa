'use client';

import { useState, useEffect } from 'react';
import { notificationAPI } from '@/lib/api';

const NOTIFICATION_TYPES = [
  { key: 'article_approved', label: 'Έγκριση άρθρου', description: 'Όταν ένα άρθρο σου εγκρίνεται' },
  { key: 'article_commented', label: 'Νέο σχόλιο', description: 'Όταν κάποιος σχολιάζει το περιεχόμενό σου' },
  { key: 'article_liked', label: 'Like σε άρθρο', description: 'Όταν κάποιος κάνει like στο άρθρο σου' },
  { key: 'new_follower', label: 'Νέος follower', description: 'Όταν κάποιος σε ακολουθεί' },
  { key: 'endorsement_received', label: 'Νέα υποστήριξη', description: 'Όταν κάποιος σε υποστηρίζει' },
  { key: 'poll_result', label: 'Αποτελέσματα δημοψηφίσματος', description: 'Ενημερώσεις για δημοψηφίσματα' },
  { key: 'badge_earned', label: 'Νέο badge', description: 'Όταν κερδίσεις ένα badge' },
  { key: 'mention', label: 'Αναφορά', description: 'Όταν κάποιος σε αναφέρει' },
  { key: 'report_resolved', label: 'Επίλυση αναφοράς', description: 'Όταν μια αναφορά σου επιλυθεί' },
  { key: 'system_announcement', label: 'Ανακοινώσεις συστήματος', description: 'Σημαντικές ανακοινώσεις από τη διαχείριση' },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    notificationAPI.getPreferences()
      .then(res => setPrefs(res.data?.preferences ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    setPrefs(prev => ({
      ...prev,
      // undefined/true → false (opt out), false → true (opt back in)
      [key]: prev[key] === false ? true : false
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await notificationAPI.updatePreferences(prefs);
      setPrefs(res.data?.preferences ?? prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center h-10 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {NOTIFICATION_TYPES.map(({ key, label, description }) => {
          const isEnabled = prefs[key] !== false; // undefined = enabled
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={label}
                onClick={() => handleToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Αποθηκεύτηκε</span>}
      </div>
    </div>
  );
}
