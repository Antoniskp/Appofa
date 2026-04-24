'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const GDPR_KEY = 'gdpr_consent';

/**
 * Reads and parses the GDPR consent object from localStorage.
 * @returns {{ necessary: boolean, analytics: boolean, functional: boolean, timestamp: string } | null}
 */
export function getGdprConsent() {
  try {
    const raw = localStorage.getItem(GDPR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists a consent object to localStorage and fires the `gdpr-consent-updated` window event.
 * @param {{ necessary: boolean, analytics: boolean, functional: boolean }} prefs
 */
function saveConsent(prefs) {
  const consent = { necessary: true, analytics: prefs.analytics, functional: prefs.functional, timestamp: new Date().toISOString() };
  try {
    localStorage.setItem(GDPR_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('gdpr-consent-updated', { detail: consent }));
  } catch {
    // Silently ignore storage errors.
  }
}

/**
 * CookieBanner
 *
 * Displays a GDPR cookie consent banner on first visit.
 * Stores consent in localStorage under the key `gdpr_consent` and dispatches
 * a `gdpr-consent-updated` window event whenever preferences change.
 */
export default function CookieBanner() {
  const t = useTranslations('gdpr');
  // Initialise directly from localStorage to avoid a flash of content.
  // getGdprConsent() is SSR-safe (try/catch) and this is a client component.
  const [visible, setVisible] = useState(() => !getGdprConsent());
  const [showPanel, setShowPanel] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [functionalOn, setFunctionalOn] = useState(true);

  // Listen for the footer "Cookie Settings" button to re-open this banner.
  useEffect(() => {
    const handleOpen = () => {
      setShowPanel(true);
      setVisible(true);
    };
    window.addEventListener('open-cookie-settings', handleOpen);
    return () => window.removeEventListener('open-cookie-settings', handleOpen);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, functional: true });
    setVisible(false);
    setShowPanel(false);
  };

  const handleRejectNonEssential = () => {
    saveConsent({ analytics: false, functional: false });
    setVisible(false);
    setShowPanel(false);
  };

  const handleSavePreferences = () => {
    saveConsent({ analytics: analyticsOn, functional: functionalOn });
    setVisible(false);
    setShowPanel(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('banner_title')}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t border-gray-700"
    >
      <div className="app-container py-4">
        {/* Main banner row */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <p className="font-semibold text-base mb-1">{t('banner_title')}</p>
              <p className="text-gray-400 text-sm">
                {t('banner_description')}{' '}
                <Link href="/privacy" className="underline text-gray-300 hover:text-white">
                  {t('privacy_policy_link')}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
              >
                {t('accept_all')}
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
              >
                {t('reject_non_essential')}
              </button>
              <button
                onClick={() => setShowPanel((v) => !v)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
              >
                {t('manage_preferences')}
              </button>
            </div>
          </div>

          {/* Expanded preferences panel */}
          {showPanel && (
            <div className="border-t border-gray-700 pt-4 space-y-4">
              {/* Necessary — always on */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('necessary_title')}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t('necessary_description')}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 font-medium mt-0.5">{t('always_on')}</span>
              </div>

              {/* Analytics toggle */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('analytics_title')}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t('analytics_description')}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={analyticsOn}
                  onClick={() => setAnalyticsOn((v) => !v)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${analyticsOn ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analyticsOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Functional toggle */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('functional_title')}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t('functional_description')}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={functionalOn}
                  onClick={() => setFunctionalOn((v) => !v)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${functionalOn ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${functionalOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
                >
                  {t('save_preferences')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
