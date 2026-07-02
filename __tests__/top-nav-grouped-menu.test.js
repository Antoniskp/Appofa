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

  test('guest desktop nav exposes core value paths directly and tucks deeper pages under More', () => {
    const desktopNavContainer = container.querySelector('a[href="/locations"]')?.parentElement;
    expect(desktopNavContainer).toBeTruthy();
    expect(desktopNavContainer.querySelector('a[href="/locations"]')).toBeTruthy();
    expect(desktopNavContainer.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(desktopNavContainer.querySelector('a[href="/suggestions"]')).toBeTruthy();
    expect(desktopNavContainer.querySelector('a[href="/news"]')).toBeTruthy();

    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/articles"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/civic-questions"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/dream-team"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/platform"]')).toBeTruthy();
  });

  test('shows Cameras under the guest More navigation in desktop and mobile menus', () => {
    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/cameras"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/users"]')).toBeTruthy();

    const mobileCamerasLink = container.querySelector('#mobile-menu a[href="/cameras"]');
    expect(mobileCamerasLink).toBeTruthy();
  });

  test('guest More dropdown includes sub-page links without the legacy all-pages item', () => {
    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/platform"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/elections"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/citizen-help"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/education"]')).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/pages"]')).toBeFalsy();
  });

  test('guest desktop dropdown and mobile sections both exclude legacy /pages link', () => {
    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/pages"]')).toBeFalsy();

    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/platform"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/elections"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/pages"]')).toBeFalsy();
  });

  test('marks guest More menu active when inside civic polls routes', async () => {
    mockPathname = '/civic-questions/123';
    await renderTopNav();

    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.getAttribute('data-trigger-class')).toContain('bg-blue-50');
    expect(moreDropdown.getAttribute('data-trigger-class')).toContain('text-blue-700');
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

  test('uses md breakpoint classes for desktop/mobile nav switch', () => {
    const desktopNavContainer = container.querySelector('a[href="/locations"]')?.parentElement;
    const desktopAuthContainer = container.querySelector('a[href="/login"].inline-flex')?.parentElement;
    const mobileToggle = container.querySelector('button[aria-controls="mobile-menu"]');
    const mobileMenu = container.querySelector('#mobile-menu');

    expect(desktopNavContainer).toBeTruthy();
    expect(desktopNavContainer.className).toContain('md:flex');
    expect(desktopNavContainer.className).toContain('md:ml-6');
    expect(desktopNavContainer.className).not.toContain('sm:flex');

    expect(desktopAuthContainer).toBeTruthy();
    expect(desktopAuthContainer.className).toContain('md:flex');
    expect(desktopAuthContainer.className).not.toContain('sm:flex');

    expect(mobileToggle.className).toContain('md:hidden');
    expect(mobileToggle.className).not.toContain('sm:hidden');

    expect(mobileMenu.className).toContain('md:hidden');
    expect(mobileMenu.className).not.toContain('sm:hidden');
  });

  test('Education AI page is NOT in the guest More dropdown or mobile nav', () => {
    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/education/ai"]')).toBeNull();

    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/education/ai"]')).toBeNull();
  });

  test('Education page /education is still in the guest More dropdown', () => {
    const moreDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');
    expect(moreDropdown).toBeTruthy();
    expect(moreDropdown.querySelector('a[href="/education"]')).toBeTruthy();
  });

  test('authenticated users keep the grouped desktop sections', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await renderTopNav();

    const participationDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-participation-menu"]');
    expect(participationDropdown).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/civic-questions"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/suggestions"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/dream-team"]')).toBeTruthy();
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
