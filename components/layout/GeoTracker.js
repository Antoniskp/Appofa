'use client';

import { useState, useEffect, Suspense } from 'react';
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
  const [functionalConsent, setFunctionalConsent] = useState(() => getGdprConsent()?.functional ?? false);

  useEffect(() => {
    const handler = (e) => setFunctionalConsent(e.detail?.functional ?? false);
    window.addEventListener('gdpr-consent-updated', handler);
    return () => window.removeEventListener('gdpr-consent-updated', handler);
  }, []);

  useEffect(() => {
    if (!pathname || !functionalConsent) return;

    const run = async () => {
      try {
        const geo = await geoAPI.detect();
        const countryCode = geo?.data?.countryCode || null;
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
  }, [pathname, functionalConsent]);

  return null;
}

export default function GeoTracker() {
  return (
    <Suspense fallback={null}>
      <GeoTrackerInner />
    </Suspense>
  );
}
