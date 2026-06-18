'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { geoAPI, locationAPI } from '@/lib/api';
import { isValidCountryCode, saveUserCountry } from '@/lib/geo/countryResolver';

const DECISION_KEY = 'appofa_country_entry_decision_v1';

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const upper = String(value).toUpperCase().trim();
  return isValidCountryCode(upper) ? upper : null;
};

const getStoredDecision = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DECISION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistDecision = (decision, countryCode = null) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DECISION_KEY, JSON.stringify({
      decision,
      countryCode,
      updatedAt: Date.now(),
    }));
  } catch {
    // no-op
  }
};

export default function CountryEntryPopup({ isAuthenticated = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const tHome = useTranslations('home');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [alternativeCountry, setAlternativeCountry] = useState('');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated || pathname !== '/') return;
    if (getStoredDecision()) return;

    let mounted = true;

    geoAPI.detect()
      .then(async (res) => {
        if (!mounted) return;
        const data = res?.data || {};
        const code = normalizeCountryCode(data.countryCode);
        if (!code || code === 'GR') return;

        setDetectedCountry({
          code,
          name: data.countryName || code,
        });
        setAlternativeCountry(code);
        setIsVisible(true);

        const countriesRes = await locationAPI.getAll({ type: 'country', limit: 300 }).catch(() => null);
        if (!mounted || !countriesRes?.success) return;
        const countries = (countriesRes.locations || [])
          .map((country) => {
            const countryCode = normalizeCountryCode(country.code);
            if (!countryCode) return null;
            return {
              code: countryCode,
              name: country.name_local || country.name || countryCode,
            };
          })
          .filter(Boolean);
        setAvailableCountries(countries);
      })
      .catch(() => {
        // no-op
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, pathname]);

  const hasAlternateCountries = useMemo(
    () => availableCountries.some((country) => country.code !== detectedCountry?.code),
    [availableCountries, detectedCountry]
  );

  const closeWithDecision = (decision, countryCode = null) => {
    persistDecision(decision, countryCode);
    setIsVisible(false);
  };

  const handleStay = () => closeWithDecision('stay', 'GR');
  const handleDismiss = () => closeWithDecision('dismiss');

  const handleSwitch = (targetCode = detectedCountry?.code) => {
    const normalizedTarget = normalizeCountryCode(targetCode);
    if (!normalizedTarget) return;
    saveUserCountry(normalizedTarget);
    closeWithDecision('switch', normalizedTarget);
    router.push(`/country/${normalizedTarget}`);
  };

  if (!isVisible || !detectedCountry) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-white shadow-xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{tHome('country_popup_title')}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {tHome('country_popup_body', { country: detectedCountry.name })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label={tHome('country_popup_dismiss')}
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSwitch(detectedCountry.code)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {tHome('country_popup_switch_detected', { country: detectedCountry.name })}
            </button>
            <button
              type="button"
              onClick={handleStay}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {tHome('country_popup_stay')}
            </button>
          </div>

          {hasAlternateCountries && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label htmlFor="country-entry-alternative" className="text-sm text-gray-600">
                {tHome('country_popup_choose_other')}
              </label>
              <select
                id="country-entry-alternative"
                value={alternativeCountry}
                onChange={(event) => setAlternativeCountry(event.target.value)}
                className="min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {availableCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleSwitch(alternativeCountry)}
                className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                {tHome('country_popup_switch_selected')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
