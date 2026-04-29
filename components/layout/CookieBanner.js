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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <p id="cookie-banner-title" className="text-sm font-semibold text-gray-900">{t('banner_title')}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('banner_description')}</p>

        {showPanel && (
          <div className="mt-3 space-y-2 rounded-xl border border-gray-100 p-3 bg-gray-50 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">{t('necessary_title')}</p>
                <p className="text-gray-400 leading-tight">{t('necessary_description')}</p>
              </div>
              <button
                disabled
                className="relative inline-flex h-4 w-8 flex-shrink-0 items-center rounded-full bg-blue-500 opacity-50 cursor-not-allowed"
                aria-checked="true"
                role="switch"
              >
                <span className="inline-block h-3 w-3 transform translate-x-[18px] rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">{t('analytics_title')}</p>
                <p className="text-gray-400 leading-tight">{t('analytics_description')}</p>
              </div>
              <button
                onClick={() => setAnalytics(!analytics)}
                className={`relative inline-flex h-4 w-8 flex-shrink-0 items-center rounded-full transition-colors ${analytics ? 'bg-blue-500' : 'bg-gray-300'}`}
                aria-checked={analytics}
                role="switch"
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${analytics ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">{t('functional_title')}</p>
                <p className="text-gray-400 leading-tight">{t('functional_description')}</p>
              </div>
              <button
                onClick={() => setFunctional(!functional)}
                className={`relative inline-flex h-4 w-8 flex-shrink-0 items-center rounded-full transition-colors ${functional ? 'bg-blue-500' : 'bg-gray-300'}`}
                aria-checked={functional}
                role="switch"
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${functional ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleAcceptAll}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('accept_all')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleRejectNonEssential}
              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('reject_non_essential')}
            </button>
            {showPanel ? (
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('save_preferences')}
              </button>
            ) : (
              <button
                onClick={() => setShowPanel(true)}
                className="flex-1 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('manage_preferences')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
