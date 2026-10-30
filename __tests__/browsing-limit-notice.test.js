/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockUser = null;
let mockPath = '/news';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => require('react').createElement('a', props, children) }));
const Notice = require('../components/ui/BrowsingLimitNotice').default;
const { apiRequest } = require('../lib/api/client');

test('API browsing limits show a dismissible guest prompt, hidden on login and after authentication', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false, status: 429, headers: { get: () => 'application/json' },
    text: async () => JSON.stringify({ code: 'BROWSING_RATE_LIMITED', retryAfter: 60 }),
  });
  try {
    await act(async () => root.render(React.createElement(Notice)));
    await act(async () => { await expect(apiRequest('/api/news')).rejects.toMatchObject({ status: 429 }); });
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.querySelector('a[href="/register"]')).toBeTruthy();
    mockPath = '/login';
    await act(async () => root.render(React.createElement(Notice)));
    expect(container.querySelector('aside')).toBeNull();
    mockPath = '/news';
    await act(async () => root.render(React.createElement(Notice)));
    await act(async () => container.querySelector('button').click());
    expect(container.querySelector('aside')).toBeNull();
    await act(async () => { await expect(apiRequest('/api/news')).rejects.toMatchObject({ status: 429 }); });
    mockUser = { id: 1 };
    await act(async () => root.render(React.createElement(Notice)));
    expect(container.querySelector('aside')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    global.fetch = originalFetch;
  }
});
