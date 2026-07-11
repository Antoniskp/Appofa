/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/';
let mockAuthUser = null;

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) =>
      React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: mockAuthUser, loading: false }),
}));

jest.mock('@/components/ui/LoginLink', () => {
  const React = require('react');
  return function LoginLinkMock({ children, ...props }) {
    return React.createElement('a', { href: '/login', ...props }, children);
  };
});

const MobileBottomNav = require('../components/layout/MobileBottomNav').default;

describe('MobileBottomNav', () => {
  let container;
  let root;

  const render = async () => {
    await act(async () => {
      root.render(React.createElement(MobileBottomNav));
    });
  };

  beforeEach(async () => {
    mockPathname = '/';
    mockAuthUser = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await render();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders a nav element with accessible label', () => {
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBeTruthy();
  });

  test('renders five tab destinations', () => {
    const nav = container.querySelector('nav');
    // Home link
    expect(nav.querySelector('a[href="/"]')).toBeTruthy();
    // Explore link
    expect(nav.querySelector('a[href="/news"]')).toBeTruthy();
    // Participate button
    expect(nav.querySelector('button[aria-haspopup="dialog"]')).toBeTruthy();
    // My area link (guests go to /locations)
    expect(nav.querySelector('a[href="/locations"]')).toBeTruthy();
    // You link (guest → login)
    expect(nav.querySelector('a[href="/login"]')).toBeTruthy();
  });

  test('Home tab is active on "/"', () => {
    mockPathname = '/';
    const homeLink = container.querySelector('a[href="/"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink.className).toContain('text-blue-700');
  });

  test('Explore tab is active on /news', async () => {
    mockPathname = '/news';
    await render();
    const exploreLink = container.querySelector('a[href="/news"]');
    expect(exploreLink.className).toContain('text-blue-700');
  });

  test('Explore tab is active on nested /articles route', async () => {
    mockPathname = '/articles/some-article';
    await render();
    const exploreLink = container.querySelector('a[href="/news"]');
    expect(exploreLink.className).toContain('text-blue-700');
  });

  test('Explore tab is NOT active on /', () => {
    mockPathname = '/';
    const exploreLink = container.querySelector('a[href="/news"]');
    expect(exploreLink.className).not.toContain('text-blue-700');
  });

  test('Participate button has aria-expanded=false initially', () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  test('clicking Participate button opens the action sheet', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const sheet = container.querySelector('[role="dialog"]');
    expect(sheet).toBeTruthy();
    expect(sheet.getAttribute('aria-modal')).toBe('true');
  });

  test('action sheet contains links to polls, civic-questions, suggestions', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const sheet = container.querySelector('[role="dialog"]');
    expect(sheet.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(sheet.querySelector('a[href="/civic-questions"]')).toBeTruthy();
    expect(sheet.querySelector('a[href="/suggestions"]')).toBeTruthy();
  });

  test('action sheet does NOT show suggestions/new for guests', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const sheet = container.querySelector('[role="dialog"]');
    expect(sheet.querySelector('a[href="/suggestions/new"]')).toBeNull();
  });

  test('action sheet closes when backdrop is clicked', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();

    // The backdrop is the div with aria-hidden=true right before the dialog
    const backdrop = container.querySelector('[aria-hidden="true"].fixed.inset-0');
    await act(async () => {
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  test('action sheet has a close button', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const sheet = container.querySelector('[role="dialog"]');
    const closeBtn = sheet.querySelector('button[aria-label]');
    expect(closeBtn).toBeTruthy();

    await act(async () => {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  test('action sheet closes on Escape key', async () => {
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  test('authenticated user sees /profile link for You tab', async () => {
    mockAuthUser = { username: 'demo', homeLocation: null };
    await render();
    expect(container.querySelector('a[href="/profile"]')).toBeTruthy();
  });

  test('authenticated user with home location sees location link for My area', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await render();
    expect(container.querySelector('a[href="/locations/athens"]')).toBeTruthy();
  });

  test('authenticated user sees suggestions/new in action sheet', async () => {
    mockAuthUser = { username: 'demo', homeLocation: null };
    await render();
    const btn = container.querySelector('button[aria-haspopup="dialog"]');
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const sheet = container.querySelector('[role="dialog"]');
    expect(sheet.querySelector('a[href="/suggestions/new"]')).toBeTruthy();
  });

  test('My area tab is active when on user home location route', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    mockPathname = '/locations/athens';
    await render();
    const locationLink = container.querySelector('a[href="/locations/athens"]');
    expect(locationLink).toBeTruthy();
    expect(locationLink.className).toContain('text-blue-700');
  });
});
