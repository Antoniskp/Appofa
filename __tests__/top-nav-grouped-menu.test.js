/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/';

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
  useAuth: () => ({ user: null, loading: false, logout: jest.fn() }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isAdmin: false, canAccessAdmin: () => false }),
}));

jest.mock('@/components/ui/DropdownMenu', () => {
  const React = require('react');

  return function DropdownMenuMock({ triggerText, items = [], triggerClassName = '', menuId }) {
    return React.createElement(
      'div',
      {
        'data-testid': menuId ? `dropdown-${menuId}` : 'dropdown-custom',
        'data-trigger-class': triggerClassName,
      },
      triggerText,
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

describe('TopNav grouped navigation redesign', () => {
  let container;
  let root;

  const renderTopNav = async () => {
    await act(async () => {
      root.render(React.createElement(TopNav));
    });
  };

  beforeEach(async () => {
    mockPathname = '/';
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

  test('shows grouped desktop sections and participation includes Civic Polls and Dream Team', () => {
    expect(container.textContent).toContain('Ενημέρωση');
    expect(container.textContent).toContain('Συμμετοχή');
    expect(container.textContent).toContain('Κοινότητα');

    const participationDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-participation-menu"]');
    expect(participationDropdown).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/polls"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/civic-questions"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/suggestions"]')).toBeTruthy();
    expect(participationDropdown.querySelector('a[href="/dream-team"]')).toBeTruthy();
  });

  test('shows Cameras under the community navigation in desktop and mobile menus', () => {
    const communityDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-community-menu"]');
    expect(communityDropdown).toBeTruthy();
    expect(communityDropdown.querySelector('a[href="/locations"]')).toBeTruthy();
    expect(communityDropdown.querySelector('a[href="/cameras"]')).toBeTruthy();
    expect(communityDropdown.querySelector('a[href="/users"]')).toBeTruthy();

    const mobileCamerasLink = container.querySelector('#mobile-menu a[href="/cameras"]');
    expect(mobileCamerasLink).toBeTruthy();
  });

  test('Σελίδες is a dropdown with sub-page links (without legacy all-pages item)', () => {
    const pagesDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-pages-menu"]');
    expect(pagesDropdown).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/platform"]')).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/elections"]')).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/citizen-help"]')).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/education"]')).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/pages"]')).toBeFalsy();
  });

  test('Σελίδες desktop dropdown and mobile section both exclude legacy /pages link', () => {
    // Desktop: Σελίδες is a DropdownMenu
    const pagesDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-pages-menu"]');
    expect(pagesDropdown).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/pages"]')).toBeFalsy();

    // Mobile: Σελίδες section renders items as direct links (excluding /pages)
    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/platform"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/elections"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/pages"]')).toBeFalsy();
  });

  test('marks participation section active when inside civic polls routes', async () => {
    mockPathname = '/civic-questions/123';
    await renderTopNav();

    const participationDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-participation-menu"]');
    expect(participationDropdown).toBeTruthy();
    expect(participationDropdown.getAttribute('data-trigger-class')).toContain('bg-blue-50');
    expect(participationDropdown.getAttribute('data-trigger-class')).toContain('text-blue-700');
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
    expect(mobileToggle.textContent).toContain('Άνοιγμα μενού');

    await act(async () => {
      mobileToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mobileToggle.getAttribute('aria-expanded')).toBe('true');
    expect(mobileToggle.textContent).toContain('Κλείσιμο μενού');
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
    const desktopDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-information-menu"]');
    const desktopNavContainer = desktopDropdown?.parentElement;
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

  test('Education AI page is NOT in the Σελίδες dropdown or mobile nav', () => {
    // Desktop Σελίδες dropdown must NOT include /education/ai
    const pagesDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-pages-menu"]');
    expect(pagesDropdown).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/education/ai"]')).toBeNull();

    // Mobile menu must also NOT include the /education/ai link
    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.querySelector('a[href="/education/ai"]')).toBeNull();
  });

  test('Education page /education is still in the Σελίδες dropdown', () => {
    const pagesDropdown = container.querySelector('[data-testid="dropdown-desktop-nav-pages-menu"]');
    expect(pagesDropdown).toBeTruthy();
    expect(pagesDropdown.querySelector('a[href="/education"]')).toBeTruthy();
  });
});
