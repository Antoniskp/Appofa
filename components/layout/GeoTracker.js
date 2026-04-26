'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { geoAdminAPI } from '@/lib/api/geoAdmin';
import { geoAPI } from '@/lib/api/geo';
import { getGdprConsent } from '@/components/layout/CookieBanner';

const readCookie = (name) => {
  const row = document.cookie
    .split('; ')
    .find((value) => value.startsWith(`${name}=`));

  if (!row) return null;
  const separatorIndex = row.indexOf('=');
  if (separatorIndex < 0) return null;
  return row.slice(separatorIndex + 1) || null;
};

function GeoTrackerInner() {
  const pathname = usePathname();
  const [analyticsConsent, setAnalyticsConsent] = useState(() => getGdprConsent()?.analytics ?? false);

  useEffect(() => {
    const handler = (e) => setAnalyticsConsent(e.detail?.analytics ?? false);
    window.addEventListener('gdpr-consent-updated', handler);
    return () => window.removeEventListener('gdpr-consent-updated', handler);
  }, []);

  useEffect(() => {
    if (!pathname || !analyticsConsent) return;

    const run = async () => {
      let countryCode = null;
      try {
        const geo = await geoAPI.detect();
        countryCode = geo?.data?.countryCode || null;
      } catch {
        // Country detection failed; proceed without country code.
      }

      try {
        const fallbackLocale = navigator.language?.split('-')[0] || null;
        const locale = readCookie('NEXT_LOCALE') || (['el', 'en'].includes(fallbackLocale) ? fallbackLocale : null);

        // auth_token is HttpOnly — the browser sends it automatically as a cookie.
        // The backend reads it server-side from the request; do not pass it in the body.
        await geoAdminAPI.trackVisit({
          path: pathname,
          countryCode,
          locale,
        });
      } catch {
        // Silently ignore telemetry errors.
      }
    };

    run();
  }, [pathname, analyticsConsent]);

  return null;
}

export default function GeoTracker() {
  return (
    <Suspense fallback={null}>
      <GeoTrackerInner />
    </Suspense>
  );
}
