'use client';

import { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { geoAdminAPI } from '@/lib/api/geoAdmin';
import { geoAPI } from '@/lib/api/geo';

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

  // Security/anti-tampering telemetry: always record visitor entry regardless of
  // optional analytics consent. This is necessary processing for abuse prevention
  // and security monitoring. No analytics consent is required.
  useEffect(() => {
    if (!pathname) return;

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
  }, [pathname]);

  return null;
}

export default function GeoTracker() {
  return (
    <Suspense fallback={null}>
      <GeoTrackerInner />
    </Suspense>
  );
}
