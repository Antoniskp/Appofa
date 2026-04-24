'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, initGA, getGAMeasurementId } from '@/lib/analytics/google-analytics';
import { getGdprConsent } from '@/components/layout/CookieBanner';

/**
 * GoogleAnalytics Component (Internal)
 * 
 * This component handles Google Analytics integration for the Next.js app.
 * It loads the GA script and tracks page views on route changes.
 * GA is only initialised and tracks when the user has given analytics consent.
 */
function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = getGAMeasurementId();
  const [analyticsConsent, setAnalyticsConsent] = useState(() => getGdprConsent()?.analytics ?? false);

  // Listen for consent changes without requiring a page reload.
  useEffect(() => {
    const handleConsentUpdate = (e) => {
      setAnalyticsConsent(e.detail?.analytics ?? false);
    };
    window.addEventListener('gdpr-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('gdpr-consent-updated', handleConsentUpdate);
  }, []);

  // Initialize GA when analytics consent is granted.
  useEffect(() => {
    if (measurementId && analyticsConsent) {
      initGA(measurementId);
    }
  }, [measurementId, analyticsConsent]);

  // Track page views on route change only when consent is granted.
  useEffect(() => {
    if (measurementId && analyticsConsent && pathname) {
      const url = pathname + (searchParams ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, measurementId, analyticsConsent]);

  // Don't render anything if GA is not configured or consent is not given.
  if (!measurementId || !analyticsConsent) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
    </>
  );
}

/**
 * GoogleAnalytics Component (Wrapped in Suspense)
 */
export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
