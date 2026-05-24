/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/';
let mockSearch = '';
let mockMeasurementId = 'G-TEST123456';
let mockConsent = null;

const mockInitGA = jest.fn();
const mockTrackPageView = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => ({ toString: () => mockSearch }),
}));

jest.mock('next/script', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement('script', props, children),
  };
});

jest.mock('@/lib/analytics/google-analytics', () => ({
  initGA: (...args) => mockInitGA(...args),
  trackPageView: (...args) => mockTrackPageView(...args),
  getGAMeasurementId: () => mockMeasurementId,
}));

jest.mock('@/components/layout/CookieBanner', () => ({
  getGdprConsent: () => mockConsent,
}));

const GoogleAnalytics = require('../components/GoogleAnalytics').default;

describe('GoogleAnalytics component', () => {
  let container;
  let root;

  beforeEach(() => {
    mockPathname = '/';
    mockSearch = '';
    mockMeasurementId = 'G-TEST123456';
    mockConsent = null;
    mockInitGA.mockClear();
    mockTrackPageView.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('initializes and tracks page views by default on first visit', async () => {
    mockPathname = '/news';
    mockSearch = 'page=2';

    await act(async () => {
      root.render(React.createElement(GoogleAnalytics));
    });

    expect(mockInitGA).toHaveBeenCalledWith('G-TEST123456');
    expect(mockTrackPageView).toHaveBeenCalledWith('/news?page=2');
    const script = container.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    expect(script).toBeTruthy();
    expect(script.getAttribute('src')).toContain('G-TEST123456');
  });

  test('renders nothing and does not track after explicit opt-out', async () => {
    mockConsent = { analytics: false };

    await act(async () => {
      root.render(React.createElement(GoogleAnalytics));
    });

    expect(mockInitGA).not.toHaveBeenCalled();
    expect(mockTrackPageView).not.toHaveBeenCalled();
    expect(container.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });

  test('starts GA when consent is granted after initial render', async () => {
    mockPathname = '/polls';
    mockConsent = { analytics: false };

    await act(async () => {
      root.render(React.createElement(GoogleAnalytics));
    });

    expect(mockInitGA).not.toHaveBeenCalled();
    expect(mockTrackPageView).not.toHaveBeenCalled();
    expect(container.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('gdpr-consent-updated', { detail: { analytics: true } }));
    });

    expect(mockInitGA).toHaveBeenCalledWith('G-TEST123456');
    expect(mockTrackPageView).toHaveBeenCalledWith('/polls?');
    expect(container.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeTruthy();
  });
});
