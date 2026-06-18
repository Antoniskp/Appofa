/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let authState = { user: null, loading: false };

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => authState,
}));

jest.mock('@/components/newsletter/NewsletterSignupForm', () => {
  const React = require('react');
  return function NewsletterSignupFormMock() {
    return React.createElement('div', { 'data-testid': 'newsletter-signup' }, 'newsletter-signup');
  };
});

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

const Footer = require('../components/layout/Footer').default;

describe('Footer newsletter visibility', () => {
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
    authState = { user: null, loading: false };
    document.body.innerHTML = '';
  });

  test('shows newsletter signup for logged-out visitors', async () => {
    authState = { user: null, loading: false };

    await act(async () => {
      root.render(React.createElement(Footer));
    });

    expect(container.querySelector('[data-testid="newsletter-signup"]')).toBeTruthy();
  });

  test('hides newsletter signup for logged-in users', async () => {
    authState = { user: { id: 1, email: 'user@test.com' }, loading: false };

    await act(async () => {
      root.render(React.createElement(Footer));
    });

    expect(container.querySelector('[data-testid="newsletter-signup"]')).toBeNull();
  });
});
