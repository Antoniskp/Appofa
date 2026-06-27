/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const { useAuth } = require('@/lib/auth-context');
const { usePathname } = require('next/navigation');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin'),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const AdminSidebar = require('../components/admin/AdminSidebar').default;

const renderSidebar = (user = { role: 'admin' }, pathname = '/admin') => {
  useAuth.mockReturnValue({ user });
  usePathname.mockReturnValue(pathname);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(AdminSidebar));
  });

  return { container, root };
};

afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});

describe('AdminSidebar', () => {
  it('groups admin navigation into operational sections', () => {
    const { container, root } = renderSidebar();

    expect(container.textContent).toContain('Overview');
    expect(container.textContent).toContain('People');
    expect(container.textContent).toContain('Content');
    expect(container.textContent).toContain('Moderation');
    expect(container.textContent).toContain('Locations & Access');
    expect(container.textContent).toContain('System');
    expect(container.textContent).toContain('Geo & Countries');
    expect(container.textContent).toContain('Organizations');
    expect(container.querySelector('nav a[href="/admin"]')?.getAttribute('aria-current')).toBe('page');

    act(() => root.unmount());
  });

  it('hides admin-only destinations for moderators', () => {
    const { container, root } = renderSidebar({ role: 'moderator' });

    expect(container.textContent).toContain('Reports');
    expect(container.textContent).toContain('Locations');
    expect(container.textContent).not.toContain('Geo & Countries');
    expect(container.textContent).not.toContain('IP Rules');
    expect(container.textContent).not.toContain('System Health');
    expect(container.textContent).not.toContain('Worker Status');

    act(() => root.unmount());
  });
});
