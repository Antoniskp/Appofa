/**
 * Google Analytics Integration Module
 * 
 * This module provides utilities for integrating Google Analytics (GA4) 
 * with the Next.js application.
 */

/**
 * Initialize Google Analytics with the given measurement ID
 * @param {string} measurementId - Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)
 */
export const initGA = (measurementId) => {
  if (typeof window === 'undefined' || !measurementId) {
    return;
  }

  // Initialize gtag if it doesn't exist
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Only called after the visitor opted in to analytics
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  });
};

/**
 * Withdraw analytics consent: stop GA from storing data and remove its cookies.
 * @param {string} measurementId
 */
export const revokeGA = (measurementId) => {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
  if (measurementId) {
    window[`ga-disable-${measurementId}`] = true;
  }
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n === '_ga' || n.startsWith('_ga_')).forEach((name) => {
    domains.forEach((d) => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
};

/**
 * Track page views
 * @param {string} url - The URL to track
 */
export const trackPageView = (url) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const measurementId = getGAMeasurementId();
  if (!measurementId) {
    return;
  }

  window.gtag('config', measurementId, {
    page_path: url,
  });
};

/**
 * Track custom events
 * @param {string} action - The event action (e.g., 'click', 'submit')
 * @param {Object} params - Event parameters
 * @param {string} params.category - Event category
 * @param {string} params.label - Event label
 * @param {number} params.value - Event value
 */
export const trackEvent = (action, params = {}) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', action, params);
};

/**
 * Get the GA Measurement ID from environment variables
 * @returns {string|null} The measurement ID or null if not configured
 */
export const getGAMeasurementId = () => {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
};

/**
 * Check if Google Analytics is enabled
 * @returns {boolean} True if GA is configured and enabled
 */
export const isGAEnabled = () => {
  return !!getGAMeasurementId();
};
