/** @jest-environment jsdom */

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
        })
      );
    });

    expect(container.textContent).toContain('🇬🇧');
    expect(container.textContent).toContain('Εντοπίστηκε από την περιοχή δικτύου/IP σας');

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
});
