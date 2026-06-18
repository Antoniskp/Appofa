'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { getSavedUserCountry, getDetectedCountry } from '@/lib/geo/countryResolver';

const countryCodeToFlag = (code) => {
  if (!code) return null;
  const upper = String(code).toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return [...upper].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
};

/**
 * Compact "Change location" control shown in the top navigation.
 * Reads the resolved country from cookies (client-side) and links to the
 * country onboarding/selector page so users can switch at any time.
 */
export default function CountrySwitcher({ className = '' }) {
  const tNav = useTranslations('nav');
  const [countryCode, setCountryCode] = useState(null);

  useEffect(() => {
    // Prefer explicit saved choice; fall back to IP-detected hint
    const code = getSavedUserCountry() || getDetectedCountry();
    setCountryCode(code);
  }, []);

  const flag = countryCodeToFlag(countryCode);

  return (
    <Link
      href={countryCode ? `/country/${countryCode}` : '/country/GR'}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
        'text-blue-900 hover:bg-seafoam/40 transition-colors',
        className,
      ].join(' ')}
      title={tNav('change_country')}
    >
      {flag ? (
        <span aria-hidden="true" className="text-base leading-none">{flag}</span>
      ) : (
        <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">{tNav('change_country')}</span>
      {countryCode && (
        <span className="hidden sm:inline font-medium">{countryCode}</span>
      )}
    </Link>
  );
}
