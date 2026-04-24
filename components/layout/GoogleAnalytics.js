'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, initGA, getGAMeasurementId } from '@/lib/analytics/google-analytics';
import { getGdprConsent } from '@/components/layout/CookieBanner';

/**
 * GoogleAnalytics Component (Internal)
 * 
 * This component handles Google Analytics integration for the Next.js app.
 * It loads the GA script and tracks page views on route changes.
 */
function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = getGAMeasurementId();
  const [analyticsConsent, setAnalyticsConsent] = useState(() => getGdprConsent()?.analytics ?? false);

  useEffect(() => {
    const handler = (e) => setAnalyticsConsent(e.detail?.analytics ?? false);
    window.addEventListener('gdpr-consent-updated', handler);
    return () => window.removeEventListener('gdpr-consent-updated', handler);
  }, []);

  // Initialize GA on mount
  useEffect(() => {
    if (measurementId && analyticsConsent) {
      initGA(measurementId);
    }
  }, [measurementId, analyticsConsent]);

  // Track page views on route change
  useEffect(() => {
    if (measurementId && pathname && analyticsConsent) {
      const url = pathname + (searchParams ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, measurementId, analyticsConsent]);

  // Don't render anything if GA is not configured or consent not given
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
