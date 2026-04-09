'use client';

import { useState } from 'react';

/**
 * Manifest acceptance section for the profile page.
 * Each manifest shows a checkbox for immediate accept/withdraw.
 *
 * @param {Object} props
 * @param {Array} props.manifests - Active manifests with acceptance info
 * @param {Function} props.onAccept - (slug) => Promise
 * @param {Function} props.onWithdraw - (slug) => Promise
 * @param {boolean} props.loading
 */
export default function ProfileManifestSection({ manifests, onAccept, onWithdraw, loading }) {
  const [busySlug, setBusySlug] = useState(null);

  if (!manifests || manifests.length === 0) return null;

  const handleToggle = async (manifest) => {
    if (busySlug) return;
    const slug = manifest.slug;

    if (manifest.acceptedAt) {
      // Confirmation before withdrawing
      const confirmed = window.confirm(
        'Είστε σίγουροι ότι θέλετε να αποσύρετε την αποδοχή σας;'
      );
      if (!confirmed) return;

      setBusySlug(slug);
      try {
        await onWithdraw(slug);
      } finally {
        setBusySlug(null);
      }
    } else {
      setBusySlug(slug);
      try {
        await onAccept(slug);
      } finally {
        setBusySlug(null);
      }
    }
  };

  return (
    <div>
      {loading ? (
        <p className="text-sm text-gray-500">Φόρτωση μανιφέστων...</p>
      ) : (
        <div className="space-y-4">
          {manifests.map((manifest) => (
            <div
              key={manifest.slug}
              className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{manifest.title}</p>
                {manifest.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{manifest.description}</p>
                )}
                <a
                  href={manifest.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:text-blue-800 mt-1 inline-block"
                >
                  Διαβάστε το πλήρες κείμενο →
                </a>
                {manifest.acceptedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Αποδεχτήκατε στις{' '}
                    {new Date(manifest.acceptedAt).toLocaleDateString('el-GR')}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-1 shrink-0">
                <input
                  type="checkbox"
                  checked={!!manifest.acceptedAt}
                  onChange={() => handleToggle(manifest)}
                  disabled={busySlug === manifest.slug}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  aria-label={`Αποδοχή ${manifest.title}`}
                />
                <span className="text-sm font-medium text-gray-700">Αποδέχομαι</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
