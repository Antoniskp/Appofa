/** @jest-environment jsdom */

/**
 * Tests for RateLimitBanner component rendering.
 * jsdom environment required.
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const MockLink = ({ href, children, className }) =>
    React.createElement('a', { href, className }, children);
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const RateLimitBanner = require('../components/ui/RateLimitBanner').default;

describe('RateLimitBanner', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  test('renders rate limit alert', async () => {
    await act(async () => {
      root.render(
        React.createElement(RateLimitBanner, {
          retryAfter: 300,
          resetTime: Date.now() + 300000,
          isAuthenticated: false,
        })
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent.length).toBeGreaterThan(0);
  });

  test('shows /register and /login links for unauthenticated users', async () => {
    await act(async () => {
      root.render(
        React.createElement(RateLimitBanner, {
          retryAfter: 60,
          resetTime: Date.now() + 60000,
          isAuthenticated: false,
        })
      );
    });

    const hrefs = Array.from(container.querySelectorAll('a')).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/register');
    expect(hrefs).toContain('/login');
  });

  test('does NOT show registration/login links for authenticated users', async () => {
    await act(async () => {
      root.render(
        React.createElement(RateLimitBanner, {
          retryAfter: 60,
          resetTime: Date.now() + 60000,
          isAuthenticated: true,
        })
      );
    });

    const hrefs = Array.from(container.querySelectorAll('a')).map((l) => l.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
    expect(hrefs).not.toContain('/login');
  });

  test('renders without crashing when countdown is already 0', async () => {
    await act(async () => {
      root.render(
        React.createElement(RateLimitBanner, {
          retryAfter: 0,
          resetTime: Date.now() - 5000, // already expired
          isAuthenticated: true,
        })
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  test('renders without crashing when no timing props are given', async () => {
    await act(async () => {
      root.render(
        React.createElement(RateLimitBanner, {
          isAuthenticated: false,
        })
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });
});
