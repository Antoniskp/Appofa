'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SKIP_PREFIXES = ['/_next/', '/api/', '/favicon'];

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export default function GeoTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

    const countryCode = getCookieValue('appofa_detected_country') || null;
    const locale = getCookieValue('NEXT_LOCALE') || null;
    const token = getCookieValue('token') || null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    fetch(`${apiBase}/api/admin/geo-stats/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, countryCode, locale, token }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
