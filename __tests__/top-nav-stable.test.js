/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
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
  return function DropdownMenuMock() {
    return React.createElement('div', null, 'dropdown');
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

describe('TopNav plain header behavior', () => {
  let container;
  let root;

  beforeEach(async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(TopNav));
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('renders as regular in-flow header without fixed/sticky classes', () => {
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav.className).toContain('relative');
    expect(nav.className).not.toContain('fixed');
    expect(nav.className).not.toContain('sticky');
    expect(nav.className).not.toContain('translate-y-0');
    expect(nav.className).not.toContain('-translate-y-full');
    expect(nav.className).not.toContain('transition-transform');
  });

  test('keeps mobile menu panel internally scrollable for short viewports', () => {
    const mobileMenu = container.querySelector('#mobile-menu');
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu.className).toContain('max-h-[calc(100dvh-4rem)]');
    expect(mobileMenu.className).toContain('overflow-y-auto');
  });

  test('does not change nav classes on scroll events', async () => {
    let nav = container.querySelector('nav');
    const beforeClassName = nav.className;

    await act(async () => {
      window.scrollY = 12;
      window.dispatchEvent(new Event('scroll'));
    });

    nav = container.querySelector('nav');
    expect(nav.className).toBe(beforeClassName);
  });
});
