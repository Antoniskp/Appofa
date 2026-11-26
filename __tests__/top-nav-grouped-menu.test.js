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

  const more = () => container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]');

  test('desktop shows a few primary links plus one grouped "more" menu', () => {
    const desktop = container.querySelector('.xl\\:ml-8');
    expect(desktop).toBeTruthy();
    const direct = Array.from(desktop.children).filter(el => el.tagName === 'A').map(a => a.getAttribute('href'));
    expect(direct).toEqual(['/polls', '/suggestions', '/news', '/locations']);
    expect(more()).toBeTruthy();
    for (const id of ['information', 'participation', 'community', 'pages']) {
      expect(container.querySelector('[data-testid="dropdown-desktop-nav-' + id + '-menu"]')).toBeNull();
    }
  });

  test('primary destinations are not duplicated inside the more menu', () => {
    for (const href of ['/polls', '/suggestions', '/news']) {
      expect(more().querySelector('a[href="' + href + '"]')).toBeNull();
    }
  });

  test('guests and members share the more menu and mobile sections', async () => {
    const links = () => Array.from(more().querySelectorAll('a')).map(a => a.getAttribute('href'));
    const guestLinks = links();
    expect(guestLinks.length).toBeGreaterThan(10);
    const guestMobile = container.querySelector('#mobile-menu').textContent;
    for (const id of ['information', 'participation', 'community', 'pages']) {
      expect(container.querySelector('#mobile-nav-section-' + id)).toBeTruthy();
    }
    mockAuthUser = { id: 1, username: 'member' };
    await renderTopNav();
    expect(links()).toEqual(guestLinks);
    expect(guestMobile).toContain('Σύνδεση');
  });

  test('"my area" links to the home location when set', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await renderTopNav();
    const desktop = container.querySelector('.xl\\:ml-8');
    expect(desktop.querySelector('a[href="/locations/athens"]')).toBeTruthy();
    expect(container.querySelector('#mobile-menu a[href="/locations/athens"]')).toBeTruthy();
  });

  test('mobile drawer starts with the same primary links', () => {
    const first = container.querySelector('#mobile-menu .grid');
    const hrefs = Array.from(first.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/polls', '/suggestions', '/news', '/locations']);
  });

  test('keeps Map and Users reachable on desktop and mobile', () => {
    for (const menu of [more(), container.querySelector('#mobile-menu')]) {
      expect(menu.querySelector('a[href="/map"]')).toBeTruthy();
      expect(menu.querySelector('a[href="/users"]')).toBeTruthy();
    }
    expect(container.querySelector('a[href="/cameras"], a[href="/live"], a[href="/candidates"]')).toBeNull();
  });

  test('more menu includes sub-page links without the legacy all-pages item', () => {
    for (const href of ['/platform', '/elections', '/citizen-help', '/education']) {
      expect(more().querySelector('a[href="' + href + '"]')).toBeTruthy();
    }
    expect(more().querySelector('a[href="/pages"]')).toBeFalsy();
    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu.querySelector('a[href="/platform"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/pages"]')).toBeFalsy();
  });

  test('marks the more menu active inside civic questions routes', async () => {
    mockPathname = '/civic-questions/123';
    await renderTopNav();
    expect(more().getAttribute('data-trigger-class')).toContain('bg-blue-50');
    expect(more().getAttribute('data-trigger-class')).toContain('text-blue-700');
  });

  test('marks a primary link as current page', async () => {
    mockPathname = '/polls/42';
    await renderTopNav();
    const link = container.querySelector('.xl\\:ml-8 a[href="/polls"]');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.className).toContain('bg-blue-50');
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

  test('uses xl breakpoint classes for desktop/mobile nav switch', () => {
    const desktopNavContainer = container.querySelector('[data-testid="dropdown-desktop-nav-more-menu"]')?.parentElement;
    const desktopAuthContainer = container.querySelector('a[href="/login"].inline-flex')?.parentElement;
    const mobileToggle = container.querySelector('button[aria-controls="mobile-menu"]');
    const mobileMenu = container.querySelector('#mobile-menu');

    expect(desktopNavContainer).toBeTruthy();
    expect(desktopNavContainer.className).toContain('xl:flex');
    expect(desktopNavContainer.className).toContain('xl:ml-8');
    expect(desktopNavContainer.className).not.toContain('sm:flex');

    expect(desktopAuthContainer).toBeTruthy();
    expect(desktopAuthContainer.className).toContain('xl:flex');
    expect(desktopAuthContainer.className).not.toContain('sm:flex');

    expect(mobileToggle.className).toContain('xl:hidden');
    expect(mobileToggle.className).not.toContain('sm:hidden');

    expect(mobileMenu.className).toContain('xl:hidden');
    expect(mobileMenu.className).not.toContain('sm:hidden');
  });

  test('Education AI page is NOT in the more menu or mobile nav', () => {
    expect(more().querySelector('a[href="/education/ai"]')).toBeNull();
    expect(container.querySelector('#mobile-menu a[href="/education/ai"]')).toBeNull();
  });

  test('authenticated users keep the grouped destinations in the more menu', async () => {
    mockAuthUser = { username: 'demo', homeLocation: { slug: 'athens' } };
    await renderTopNav();
    expect(more().querySelector('a[href="/users"]')).toBeTruthy();
    expect(more().querySelector('a[href="/independents"]')).toBeFalsy();
    expect(more().querySelector('a[href="/civic-questions"]')).toBeTruthy();
    expect(more().querySelector('a[href="/dream-team"]')).toBeTruthy();
    const desktop = container.querySelector('.xl\\:ml-8');
    expect(desktop.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(desktop.querySelector('a[href="/suggestions"]')).toBeTruthy();
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
