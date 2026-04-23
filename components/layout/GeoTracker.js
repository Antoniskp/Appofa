'use client';

import { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { geoAdminAPI } from '@/lib/api/geoAdmin';
import { geoAPI } from '@/lib/api/geo';

function GeoTrackerInner() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const run = async () => {
      try {
        const geo = await geoAPI.detect();
        const countryCode = geo?.data?.countryCode || null;
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('auth_token='))
          ?.split('=')[1] || null;

        await geoAdminAPI.trackVisit({
          path: pathname,
          countryCode,
          locale: navigator.language || null,
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
