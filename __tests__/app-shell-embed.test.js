/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('@/components/TopNav', () => {
  const React = require('react');
  return function MockTopNav() {
    return React.createElement('div', { 'data-testid': 'top-nav' }, 'TopNav');
  };
});

jest.mock('@/components/Footer', () => {
  const React = require('react');
  return function MockFooter() {
    return React.createElement('div', { 'data-testid': 'footer' }, 'Footer');
  };
});

jest.mock('@/components/layout/CookieBanner', () => {
  const React = require('react');
  return function MockCookieBanner() {
    return React.createElement('div', { 'data-testid': 'cookie-banner' }, 'CookieBanner');
  };
});

const AppShell = require('../components/layout/AppShell').default;

describe('AppShell embed routing', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockPathname = '/';
  });

  test('hides global chrome on embed routes', async () => {
    mockPathname = '/embed/polls/5-demo';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AppShell, null, React.createElement('div', null, 'child')));
    });

    expect(container.querySelector('[data-testid="top-nav"]')).toBeNull();
    expect(container.querySelector('[data-testid="footer"]')).toBeNull();
    expect(container.querySelector('[data-testid="cookie-banner"]')).toBeNull();
    expect(container.textContent).toContain('child');

    await act(async () => {
      root.unmount();
    });
  });

  test('keeps global chrome on normal routes', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AppShell, null, React.createElement('div', null, 'child')));
    });

    expect(container.querySelector('[data-testid="top-nav"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="cookie-banner"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
