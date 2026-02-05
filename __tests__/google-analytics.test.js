/**
 * Tests for Google Analytics integration module
 */

// Mock window.gtag and dataLayer
const mockGtag = jest.fn();
const mockDataLayer = [];

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  mockDataLayer.length = 0;
  
  // Setup window object
  global.window = {
    gtag: mockGtag,
    dataLayer: mockDataLayer,
    location: {
      pathname: '/test-path'
    }
  };
  
  // Mock environment variable
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123456';
});

afterEach(() => {
  delete global.window;
  delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
});

describe('Google Analytics Module', () => {
  let analytics;

  beforeEach(() => {
    // Dynamically import the module to ensure fresh state
    jest.isolateModules(() => {
      analytics = require('@/lib/analytics/google-analytics');
    });
  });

  describe('getGAMeasurementId', () => {
    it('should return the measurement ID from environment variables', () => {
      expect(analytics.getGAMeasurementId()).toBe('G-TEST123456');
    });

    it('should return null when measurement ID is not configured', () => {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      expect(analytics.getGAMeasurementId()).toBeNull();
    });
  });

  describe('isGAEnabled', () => {
    it('should return true when measurement ID is configured', () => {
      expect(analytics.isGAEnabled()).toBe(true);
    });

    it('should return false when measurement ID is not configured', () => {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      expect(analytics.isGAEnabled()).toBe(false);
    });
  });

  describe('initGA', () => {
    it('should initialize Google Analytics with measurement ID', () => {
      delete global.window.gtag;
      delete global.window.dataLayer;
      
      analytics.initGA('G-TEST123456');
      
      expect(global.window.dataLayer).toBeDefined();
      expect(global.window.gtag).toBeDefined();
    });

    it('should not initialize when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;
      
      // Should not throw error
      expect(() => analytics.initGA('G-TEST123456')).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should not initialize when measurement ID is not provided', () => {
      delete global.window.gtag;
      delete global.window.dataLayer;
      
      analytics.initGA(null);
      
      expect(global.window.dataLayer).toBeUndefined();
      expect(global.window.gtag).toBeUndefined();
    });
  });

  describe('trackPageView', () => {
    it('should track page view with the correct URL', () => {
      analytics.trackPageView('/test-page');
      
      expect(mockGtag).toHaveBeenCalledWith(
        'config',
        'G-TEST123456',
        { page_path: '/test-page' }
      );
    });

    it('should not track when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;
      
      analytics.trackPageView('/test-page');
      
      expect(mockGtag).not.toHaveBeenCalled();
      
      global.window = originalWindow;
    });

    it('should not track when gtag is not available', () => {
      delete global.window.gtag;
      
      analytics.trackPageView('/test-page');
      
      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('should track custom event with action and parameters', () => {
      const params = {
        category: 'engagement',
        label: 'button_click',
        value: 1
      };
      
      analytics.trackEvent('click', params);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'click', params);
    });

    it('should track event with empty parameters', () => {
      analytics.trackEvent('page_scroll');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_scroll', {});
    });

    it('should not track when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;
      
      analytics.trackEvent('click', { category: 'test' });
      
      expect(mockGtag).not.toHaveBeenCalled();
      
      global.window = originalWindow;
    });

    it('should not track when gtag is not available', () => {
      delete global.window.gtag;
      
      analytics.trackEvent('click', { category: 'test' });
      
      expect(mockGtag).not.toHaveBeenCalled();
    });
  });
});
