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

jest.mock('@/lib/api', () => ({
  adminSummaryAPI: {
    getQueueCounts: jest.fn(),
  },
}));

const { adminSummaryAPI } = require('@/lib/api');
const AdminSidebar = require('../components/admin/AdminSidebar').default;

const renderSidebar = (user = { role: 'admin' }, pathname = '/admin') => {
  useAuth.mockReturnValue({ user });
  usePathname.mockReturnValue(pathname);
  if (!adminSummaryAPI.getQueueCounts.getMockImplementation()) {
    adminSummaryAPI.getQueueCounts.mockResolvedValue({});
  }

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
  adminSummaryAPI.getQueueCounts.mockReset();
  document.body.innerHTML = '';
});

describe('AdminSidebar', () => {
  it('groups admin navigation into operational sections', () => {
    const { container, root } = renderSidebar();

    expect(container.textContent).toContain('Overview');
    expect(container.textContent).toContain('Queues');
    expect(container.textContent).toContain('People & Orgs');
    expect(container.textContent).toContain('Content');
    expect(container.textContent).toContain('Locations');
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

  it('shows pending queue badges from the admin summary', async () => {
    adminSummaryAPI.getQueueCounts.mockResolvedValue({
      '/admin/reports': 3,
      '/admin/messages': 125,
      '/admin/persons/claims': 0,
    });
    const { container, root } = renderSidebar({ role: 'admin' });

    await act(async () => {});

    expect(container.querySelector('a[href="/admin/reports"]')?.textContent).toContain('3');
    expect(container.querySelector('a[href="/admin/messages"]')?.textContent).toContain('99+');
    expect(container.querySelector('a[href="/admin/persons/claims"]')?.textContent).not.toContain('0');

    act(() => root.unmount());
  });
});
