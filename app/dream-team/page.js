'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Known countries with active Dream Team configurations.
 * To add a new country: drop a <CC>.json file in config/countries/ and add an
 * entry here so it appears in the selector.
 */
const AVAILABLE_COUNTRIES = [
  { code: 'GR', name: 'Ελλάδα', flag: '🇬🇷', description: 'Ελληνική Κυβέρνηση' },
];

/**
 * Dream Team landing page — country selector.
 *
 * Currently Greece is the only active country so we redirect immediately to
 * /dream-team/gr for backward compatibility. As more countries are added,
 * this page will show the full selector grid.
 */
export default function DreamTeamPage() {
  const router = useRouter();

  // Auto-redirect to Greece when it is the only available country
  useEffect(() => {
    if (AVAILABLE_COUNTRIES.length === 1) {
      router.replace(`/dream-team/${AVAILABLE_COUNTRIES[0].code.toLowerCase()}`);
    }
  }, [router]);

  // Show selector (visible briefly before redirect, or when multiple countries exist)
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
          {AVAILABLE_COUNTRIES.map((country) => (
            <Link
              key={country.code}
              href={`/dream-team/${country.code.toLowerCase()}`}
              className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <span className="text-4xl">{country.flag}</span>
              <div className="text-left">
                <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {country.name}
                </div>
                <div className="text-sm text-gray-500">{country.description}</div>
              </div>
              <span className="ml-auto text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
