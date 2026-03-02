'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, initGA, getGAMeasurementId } from '@/lib/analytics/google-analytics';

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

  // Initialize GA on mount
  useEffect(() => {
    if (measurementId) {
      initGA(measurementId);
    }
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    if (measurementId && pathname) {
      const url = pathname + (searchParams ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, measurementId]);

  // Don't render anything if GA is not configured
  if (!measurementId) {
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
