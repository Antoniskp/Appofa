'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/lib/auth-context';
import { resolveUserDreamTeamCountryCode } from '@/lib/utils/userCountryCode';

/**
 * Display metadata (name, flag) for known ISO country codes.
 * Only used for UI enrichment — the authoritative list of active countries
 * is loaded from the backend /api/dream-team/countries endpoint.
 */
const COUNTRY_META = {
  GR: { name: 'Ελλάδα', flag: '🇬🇷', description: 'Ελληνική Κυβέρνηση' },
  FR: { name: 'France', flag: '🇫🇷', description: 'Gouvernement Français' },
  DE: { name: 'Germany', flag: '🇩🇪', description: 'Bundesregierung' },
  ES: { name: 'España', flag: '🇪🇸', description: 'Gobierno de España' },
  IT: { name: 'Italia', flag: '🇮🇹', description: 'Governo Italiano' },
  CY: { name: 'Cyprus', flag: '🇨🇾', description: 'Government of Cyprus' },
  US: { name: 'United States', flag: '🇺🇸', description: 'U.S. Federal Government' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', description: 'UK Government' },
};

function getCountryMeta(code) {
  return COUNTRY_META[code] || { name: code, flag: '🌐', description: '' };
}

/**
 * Dream Team landing page — dynamic country selector.
 *
 * Loads the list of countries with active configurations from the backend.
 * When only one country is available, redirects immediately to its page
 * for backward compatibility.
 *
 * The `?browse=1` query param suppresses the logged-in-user auto-redirect so
 * that the country selector is shown intentionally (e.g. from "Άλλες χώρες").
 */
function DreamTeamPageInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // When ?browse=1 is present the user intentionally wants the selector — skip redirect.
  const browseMode = searchParams.get('browse') === '1';

  const { data: countriesData, loading } = useAsyncData(
    () => dreamTeamAPI.getCountries(),
    [],
  );

  const countries = countriesData?.data || [];

  // Auto-redirect to user's own country when available.
  // Fallback to single-country auto redirect for compatibility.
  // Skip redirect in browse mode so the selector is shown intentionally.
  useEffect(() => {
    if (loading || authLoading) return;
    if (browseMode) return;

    if (user) {
      const availableCountryCodes = countries.map((country) => country.countryCode);
      const userCountryCode = resolveUserDreamTeamCountryCode(user, {
        allowedCountryCodes: availableCountryCodes,
      });
      if (userCountryCode) {
        router.replace(`/dream-team/${userCountryCode.toLowerCase()}`);
        return;
      }
    }

    if (countries.length === 1) {
      router.replace(`/dream-team/${countries[0].countryCode.toLowerCase()}`);
    }
  }, [loading, authLoading, browseMode, countries, router, user]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="app-container max-w-2xl mx-auto">
          <SkeletonLoader count={2} type="card" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="app-container max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <span className="text-6xl mb-4 block">🌍</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dream Team</h1>
          <p className="text-gray-500 text-lg">
            Επιλέξτε χώρα για να ψηφίσετε την ιδανική κυβέρνηση
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {countries.map((country) => {
            const meta = getCountryMeta(country.countryCode);
            return (
              <Link
                key={country.countryCode}
                href={`/dream-team/${country.countryCode.toLowerCase()}`}
                className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <span className="text-4xl">{meta.flag}</span>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {meta.name}
                  </div>
                  <div className="text-sm text-gray-500">{meta.description}</div>
                </div>
                <span className="ml-auto text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DreamTeamPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="app-container max-w-2xl mx-auto">
          <SkeletonLoader count={2} type="card" />
        </div>
      </div>
    }>
      <DreamTeamPageInner />
    </Suspense>
  );
}
