'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

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
 */
export default function DreamTeamPage() {
  const router = useRouter();

  const { data: countriesData, loading } = useAsyncData(
    () => dreamTeamAPI.getCountries(),
    [],
  );

  const countries = countriesData?.data || [];

  // Auto-redirect when only one country is configured
  useEffect(() => {
    if (!loading && countries.length === 1) {
      router.replace(`/dream-team/${countries[0].countryCode.toLowerCase()}`);
    }
  }, [loading, countries, router]);

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
