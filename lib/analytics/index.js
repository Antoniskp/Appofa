/**
 * Analytics Module Entry Point
 * 
 * Re-exports all analytics functionality for easy importing
 */

export {
  initGA,
  trackPageView,
  trackEvent,
  getGAMeasurementId,
  isGAEnabled,
} from './google-analytics';
