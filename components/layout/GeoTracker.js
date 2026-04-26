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
        const token = readCookie('auth_token');
        const fallbackLocale = navigator.language?.split('-')[0] || null;
        const locale = readCookie('NEXT_LOCALE') || (['el', 'en'].includes(fallbackLocale) ? fallbackLocale : null);

        await geoAdminAPI.trackVisit({
          path: pathname,
          countryCode,
          locale,
          ...(token ? { token } : {}),
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
