'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export function getGdprConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gdpr_consent');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics, functional) {
  const consent = {
    necessary: true,
    analytics,
    functional,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('gdpr_consent', JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('gdpr-consent-updated', { detail: consent }));
  return consent;
}

export default function CookieBanner() {
  const t = useTranslations('gdpr');
  const [visible, setVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const existing = getGdprConsent();
    if (!existing) {
      setVisible(true);
    }

    const handleOpen = () => {
      setVisible(true);
      setShowPanel(true);
    };
    window.addEventListener('open-cookie-settings', handleOpen);
    return () => window.removeEventListener('open-cookie-settings', handleOpen);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    saveConsent(true, true);
    setVisible(false);
    setShowPanel(false);
  };

  const handleRejectNonEssential = () => {
    saveConsent(false, false);
    setVisible(false);
    setShowPanel(false);
  };

  const handleSavePreferences = () => {
    saveConsent(analytics, functional);
    setVisible(false);
    setShowPanel(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <p className="text-lg font-semibold text-gray-900 mb-1">{t('banner_title')}</p>
        <p className="text-sm text-gray-600 mb-3">{t('banner_description')}</p>

        {showPanel && (
          <div className="mb-4 space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('necessary_title')}</p>
                <p className="text-xs text-gray-500">{t('necessary_description')}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  disabled
                  className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-600 opacity-50 cursor-not-allowed"
                  aria-checked="true"
                  role="switch"
                >
                  <span className="inline-block h-3 w-3 transform translate-x-5 rounded-full bg-white" />
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('analytics_title')}</p>
                <p className="text-xs text-gray-500">{t('analytics_description')}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${analytics ? 'bg-blue-600' : 'bg-gray-300'}`}
                  aria-checked={analytics}
                  role="switch"
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${analytics ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('functional_title')}</p>
                <p className="text-xs text-gray-500">{t('functional_description')}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setFunctional(!functional)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${functional ? 'bg-blue-600' : 'bg-gray-300'}`}
                  aria-checked={functional}
                  role="switch"
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${functional ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('accept_all')}
          </button>
          <button
            onClick={handleRejectNonEssential}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('reject_non_essential')}
          </button>
          {showPanel ? (
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              {t('save_preferences')}
            </button>
          ) : (
            <button
              onClick={() => setShowPanel(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('manage_preferences')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
