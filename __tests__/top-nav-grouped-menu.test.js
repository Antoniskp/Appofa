/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/';
let mockAuthUser = null;
let mockCanAccessAdmin = false;

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/image', () => {
  const React = require('react');
  return function NextImageMock(props) {
    const { priority, ...rest } = props;
    return React.createElement('img', rest);
  };
});

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: mockAuthUser, loading: false, logout: jest.fn() }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isAdmin: mockCanAccessAdmin, canAccessAdmin: () => mockCanAccessAdmin }),
}));

jest.mock('@/components/ui/DropdownMenu', () => {
  const React = require('react');

  return function DropdownMenuMock({ triggerText, trigger, items = [], triggerClassName = '', menuId }) {
    return React.createElement(
      'div',
      {
        'data-testid': menuId ? `dropdown-${menuId}` : 'dropdown-custom',
        'data-trigger-class': triggerClassName,
      },
      trigger || triggerText,
      React.createElement(
        'ul',
        null,
        ...items
          .filter((item) => item.href)
          .map((item) =>
            React.createElement(
              'li',
              { key: item.id || item.href },
              React.createElement('a', { href: item.href }, item.label)
            )
          )
      )
    );
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react');
  return function SkeletonLoaderMock() {
    return React.createElement('div', null, 'skeleton');
  };
});

jest.mock('@/components/ui/Tooltip', () => {
  const React = require('react');
  return function TooltipMock({ children }) {
    return React.createElement(React.Fragment, null, children);
  };
});

jest.mock('@/components/ui/LoginLink', () => {
  const React = require('react');
  return function LoginLinkMock({ children, ...props }) {
    return React.createElement('a', { href: '/login', ...props }, children);
  };
});

jest.mock('@/components/notifications/NotificationBell', () => {
  const React = require('react');
  return function NotificationBellMock() {
    return React.createElement('div', null, 'bell');
  };
});

const TopNav = require('../components/layout/TopNav').default;

describe('TopNav simplified navigation', () => {
  let container;
  let root;

  const renderTopNav = async () => {
    await act(async () => {
      root.render(React.createElement(TopNav));
    });
  };

  beforeEach(async () => {
    mockPathname = '/';
    mockAuthUser = null;
    mockCanAccessAdmin = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await renderTopNav();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('uses the same community-first destinations for guests and members', async () => {
    for (const user of [null, { username: 'demo', homeLocation: { slug: 'athens' } }]) {
      mockAuthUser = user;
      await renderTopNav();
      for (const id of ['community', 'participation', 'information', 'pages']) {
        expect(container.querySelector('[data-testid="dropdown-desktop-nav-' + id + '-menu"]')).toBeTruthy();
      }
      expect(container.querySelector('a[href="/progress"]')).toBeTruthy();
      expect(container.querySelector('a[href="/suggestions/new"]')).toBeTruthy();
    }
  });

  test('groups people with discovery and keeps civic actions together', () => {
    const discover = container.querySelector('[data-testid="dropdown-desktop-nav-information-menu"]');
    for (const route of ['/news', '/articles', '/videos', '/topics', '/users', '/candidates', '/organizations']) {
      expect(discover.querySelector('a[href="' + route + '"]')).toBeTruthy();
    }
    const participation = container.querySelector('[data-testid="dropdown-desktop-nav-participation-menu"]');
    for (const route of ['/polls', '/suggestions', '/civic-questions', '/dream-team']) {
      expect(participation.querySelector('a[href="' + route + '"]')).toBeTruthy();
      expect(container.querySelector('#mobile-menu a[href="' + route + '"]')).toBeTruthy();
    }
  });

  test('keeps practical guides reachable without platform documentation in primary menus', () => {
    const guides = container.querySelector('[data-testid="dropdown-desktop-nav-pages-menu"]');
    for (const route of ['/citizen-help', '/elections', '/education']) expect(guides.querySelector('a[href="' + route + '"]')).toBeTruthy();
    expect(container.querySelector('a[href="/platform"]')).toBeFalsy();
    expect(container.querySelector('a[href="/pages"]')).toBeFalsy();
    expect(container.querySelector('a[href="/education/ai"]')).toBeFalsy();
  });

  test('marks participation active for a civic-question detail route', async () => {
    mockPathname = '/civic-questions/123';
    await renderTopNav();
    expect(container.querySelector('[data-testid="dropdown-desktop-nav-participation-menu"]').getAttribute('data-trigger-class')).toContain('bg-blue-50');
  });

  test('uses stronger auth CTA hierarchy and improved mobile touch-target classes', () => {
    const loginLink = container.querySelector('a[href="/login"]');
    const registerLink = container.querySelector('a[href="/register"]');
    expect(loginLink).toBeTruthy();
    expect(registerLink).toBeTruthy();

    expect(loginLink.className).toContain('border');
    expect(registerLink.className).toContain('bg-blue-600');

    const mobileCivicPollsLink = container.querySelector('#mobile-menu a[href="/civic-questions"]');
    expect(mobileCivicPollsLink).toBeTruthy();
    expect(mobileCivicPollsLink.className).toContain('min-h-11');
    expect(mobileCivicPollsLink.className).toContain('focus-visible:outline');
  });

  test('updates mobile menu toggle screen-reader text and expanded state', async () => {
    const mobileToggle = container.querySelector('button[aria-controls="mobile-menu"]');
    expect(mobileToggle).toBeTruthy();
    expect(mobileToggle.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      mobileToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mobileToggle.getAttribute('aria-expanded')).toBe('true');
  });

  test('closes mobile menu immediately when clicking a mobile section link', async () => {
    const mobileToggle = container.querySelector('button[aria-controls="mobile-menu"]');
    const mobileMenu = container.querySelector('#mobile-menu');
    const civicQuestionsLink = container.querySelector('#mobile-menu a[href="/civic-questions"]');
    civicQuestionsLink.addEventListener('click', (event) => event.preventDefault());

    await act(async () => {
      mobileToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mobileMenu.className).toContain('block');

    await act(async () => {
      civicQuestionsLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mobileMenu.className).toContain('hidden');
  });

  test('closes mobile menu immediately when clicking a mobile auth link', async () => {
    const mobileToggle = container.querySelector('button[aria-controls="mobile-menu"]');
    const mobileMenu = container.querySelector('#mobile-menu');
    const mobileLoginLink = container.querySelector('#mobile-menu a[href="/login"]');
    mobileLoginLink.addEventListener('click', (event) => event.preventDefault());

    await act(async () => {
      mobileToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mobileMenu.className).toContain('block');

    await act(async () => {
      mobileLoginLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(mobileMenu.className).toContain('hidden');
  });

  test('uses the compact menu on tablets and restores focus on Escape', async () => {
    const toggle = container.querySelector('button[aria-controls="mobile-menu"]');
    expect(toggle.className).toContain('lg:hidden');
    await act(async () => toggle.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  test('authenticated desktop menu stays focused on account-level links', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await renderTopNav();

    const userDropdown = container.querySelector('[data-testid="dropdown-desktop-user-menu"]');
    expect(userDropdown).toBeTruthy();
    expect(userDropdown.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(userDropdown.querySelector('a[href="/locations/athens"]')).toBeTruthy();

    expect(userDropdown.querySelector('a[href="/editor"]')).toBeFalsy();
    expect(userDropdown.querySelector('a[href="/my-news"]')).toBeFalsy();
    expect(userDropdown.querySelector('a[href="/my-polls"]')).toBeFalsy();
    expect(userDropdown.querySelector('a[href="/my-votes"]')).toBeFalsy();
    expect(userDropdown.querySelector('a[href="/suggestions?mine=true"]')).toBeFalsy();
    expect(userDropdown.querySelector('a[href="/organizations?mine=true"]')).toBeFalsy();
  });

  test('mobile authenticated account actions are direct links instead of a nested dropdown', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await renderTopNav();

    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.querySelector('[data-testid="dropdown-mobile-user-menu"]')).toBeFalsy();
    expect(mobileMenu.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/locations/athens"]')).toBeTruthy();
    expect(mobileMenu.querySelector('button[type="button"].text-red-600')).toBeTruthy();
  });

  test('authenticated admin menu exposes only the admin entry, not diagnostics', async () => {
    mockAuthUser = { username: 'admin', homeLocation: null };
    mockCanAccessAdmin = true;
    await renderTopNav();

    const userDropdown = container.querySelector('[data-testid="dropdown-desktop-user-menu"]');
    expect(userDropdown).toBeTruthy();
    expect(userDropdown.querySelector('a[href="/admin"]')).toBeTruthy();
    expect(userDropdown.querySelector('a[href="/admin/status"]')).toBeFalsy();
  });
});
