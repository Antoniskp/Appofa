/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

const CountryFundingBanner = require('../components/locations/CountryFundingBanner').default;

describe('CountryFundingBanner', () => {
  let container;
  let root;

  beforeEach(() => {
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

  test('renders meaningful no-content state with detection and diaspora/support actions', async () => {
    await act(async () => {
      root.render(
        React.createElement(CountryFundingBanner, {
          funding: null,
          locationName: 'Ηνωμένο Βασίλειο',
          countryCode: 'GB',
          hasContent: false,
          geoPanelState: {
            detectedCountryCode: 'US',
            detectedCountryName: 'United States',
            detectionSource: 'geoip-fallback',
            trustedForCountryRedirect: false,
            browserLocaleCountryCode: 'GB',
            appliedCountryCode: 'GB',
          },
        })
      );
    });

    expect(container.textContent).toContain('🇬🇧');
    expect(container.textContent).toContain('Geo IP');
    expect(container.textContent).toContain('Fallback από backend /api/geo/detect (IP lookup)');
    expect(container.textContent).toContain('Μόνο πληροφοριακό (δεν εφαρμόζεται ως redirect/country mode)');
    expect(container.textContent).toContain('Η εφαρμοσμένη λειτουργία χώρας διαφέρει από την ανίχνευση.');

    const hrefs = Array.from(container.querySelectorAll('a')).map((node) => node.getAttribute('href'));
    expect(hrefs).toContain('/contribute');
    expect(hrefs).toContain('/country/GR');
  });

  test('renders donation campaign details when funding campaign is active', async () => {
    await act(async () => {
      root.render(
        React.createElement(CountryFundingBanner, {
          funding: {
            status: 'funding',
            goalAmount: 1000,
            currentAmount: 250,
            donorCount: 3,
            donationUrl: 'https://example.com/donate',
          },
          locationName: 'United Kingdom',
          countryCode: 'GB',
          hasContent: false,
        })
      );
    });

    expect(container.textContent).toContain('Συγκεντρώθηκαν: €250.00');
    expect(container.textContent).toContain('Στόχος: €1000.00');
    expect(container.textContent).toContain('3 δωρητές');

    const donationLink = Array.from(container.querySelectorAll('a')).find(
      (node) => node.getAttribute('href') === 'https://example.com/donate'
    );
    expect(donationLink).toBeTruthy();
  });

  test('renders nothing when page has content', async () => {
    await act(async () => {
      root.render(
        React.createElement(CountryFundingBanner, {
          funding: null,
          locationName: 'Greece',
          countryCode: 'GR',
          hasContent: true,
        })
      );
    });

    expect(container.textContent).toBe('');
  });

  test('no-location path: renders polished banner when only country code is available (GB regression)', async () => {
    // Simulates the !data.location path where we derive a name from Intl.DisplayNames
    // and render CountryFundingBanner directly with no funding record.
    await act(async () => {
      root.render(
        React.createElement(CountryFundingBanner, {
          funding: null,
          locationName: 'United Kingdom',
          countryCode: 'GB',
          hasContent: false,
        })
      );
    });

    // Should show the flag and country label
    expect(container.textContent).toContain('🇬🇧');
    expect(container.textContent).toContain('United Kingdom');

    // Should NOT contain the old dead-end plain message
    expect(container.textContent).not.toContain('Δεν βρέθηκε περιεχόμενο');

    // Should have both support and diaspora CTAs
    const hrefs = Array.from(container.querySelectorAll('a')).map((node) => node.getAttribute('href'));
    expect(hrefs).toContain('/contribute');
    expect(hrefs).toContain('/country/GR');

    // Should NOT show donation link when funding is null
    const donationLink = hrefs.find((h) => h && h.startsWith('https://'));
    expect(donationLink).toBeFalsy();
  });
});
