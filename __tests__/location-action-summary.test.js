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

const LocationActionSummary = require('../components/locations/LocationActionSummary').default;

const baseCounts = {
  polls: 3,
  suggestions: 4,
  news: 2,
  articles: 1,
  users: 8,
};

const renderSummary = async (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const onTabSelect = jest.fn();

  await act(async () => {
    root.render(React.createElement(LocationActionSummary, {
      counts: baseCounts,
      loading: false,
      isAuthenticated: false,
      onTabSelect,
      ...props,
    }));
  });

  return { container, root, onTabSelect };
};

describe('LocationActionSummary guest conversion', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('shows location-specific registration benefits to guests', async () => {
    const { container, root } = await renderSummary();

    expect(container.textContent).toContain('Τοπική δραστηριότητα');
    expect(container.textContent).toContain('Μην χάσεις όσα αλλάζουν σε αυτή την περιοχή.');
    expect(container.textContent).toContain('Κράτησε την περιοχή σου στο προφίλ');
    const registerLinks = [...container.querySelectorAll('a[href="/register"]')];
    expect(registerLinks.some((link) => link.textContent.includes('Εγγραφή και επιλογή περιοχής'))).toBe(true);
    expect(container.querySelector('a[href="/newsletter"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps guest bridge hidden for authenticated users', async () => {
    const { container, root } = await renderSummary({ isAuthenticated: true });

    expect(container.textContent).not.toContain('Μην χάσεις όσα αλλάζουν σε αυτή την περιοχή.');
    expect(container.textContent).not.toContain('Εγγραφή και επιλογή περιοχής');
    expect(container.querySelector('a[href="/polls/create"]')).toBeTruthy();
    expect(container.querySelector('a[href="/suggestions/new"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  test('uses early-activation copy when a location has no activity yet', async () => {
    const { container, root } = await renderSummary({
      counts: {
        polls: 0,
        suggestions: 0,
        news: 0,
        articles: 0,
        users: 0,
      },
    });

    expect(container.textContent).toContain('Γίνε από τους πρώτους που θα ενεργοποιήσουν αυτή την περιοχή.');

    await act(async () => {
      root.unmount();
    });
  });
});
