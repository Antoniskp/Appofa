'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { resolveCountry } from '@/lib/geo/countryResolver';

const countryCodeToFlag = (code) => {
  if (!code) return null;
  const upper = String(code).toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return [...upper].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
};

/**
 * Compact "Change location" control shown in the top navigation.
 *
 * Resolution priority:
 *  1. If the current pathname is /country/[code], show that code directly
 *     (so the indicator always reflects the active country page).
 *  2. Otherwise, delegate to resolveCountry() which uses the saved-cookie →
 *     profile → browser-locale → timezone → IP-hint priority chain.
 *
 * Re-evaluates whenever the pathname changes so client-side navigation
 * (e.g. visiting /country/DE) is immediately reflected.
 */
export default function CountrySwitcher({ className = '' }) {
  const tNav = useTranslations('nav');
  const { user } = useAuth();
  const pathname = usePathname();
  const [countryCode, setCountryCode] = useState(null);

  useEffect(() => {
    // If we're on a country-specific page, use its code directly so the
    // indicator always matches the active country context.
    // Only match the exact /country/[code] segment (with optional trailing slash)
    // to avoid false positives from unrelated routes like /country-info/...
    const routeMatch = pathname ? pathname.match(/^\/country\/([A-Za-z]{2})\/?$/) : null;
    if (routeMatch) {
      setCountryCode(routeMatch[1].toUpperCase());
      return;
    }
    // Otherwise fall back to the full resolver (cookie → profile → browser signals → IP hint).
    const { code } = resolveCountry({ user: user || null });
    setCountryCode(code);
  }, [pathname, user]);

  const flag = countryCodeToFlag(countryCode);

  return (
    <Link
      href={countryCode ? `/country/${countryCode}` : '/locations' /* neutral fallback when country is undetermined */}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
        'text-blue-900 hover:bg-seafoam/40 transition-colors',
        className,
      ].join(' ')}
      title={tNav('change_country')}
      aria-label={countryCode ? `${tNav('change_country')} (${countryCode})` : tNav('change_country')}
    >
      {flag ? (
        <span aria-hidden="true" className="text-base leading-none">{flag}</span>
      ) : (
        <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">{tNav('change_country')}</span>
      {countryCode && (
        <span className="hidden sm:inline font-medium" aria-hidden="true">{countryCode}</span>
      )}
    </Link>
  );
}
