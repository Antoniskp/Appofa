/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
jest.mock('next-intl', () => ({ useTranslations: () => (key) => key }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }));
jest.mock('../components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('../components/admin/AdminLayout', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('../components/admin/AdminQueues', () => ({ __esModule: true, default: () => null }));
jest.mock('../lib/auth-context', () => ({ useAuth: () => ({ user: { role: 'admin', username: 'Admin' } }) }));
jest.mock('../lib/api', () => ({
  authAPI: { getAdminUsers: jest.fn() },
  notificationAPI: { previewBroadcast: jest.fn(), broadcast: jest.fn() },
}));
const { authAPI, notificationAPI } = require('../lib/api');
const Dashboard = require('../app/admin/page').default;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('announcement requires an explicit audience, preview, and final send', async () => {
  authAPI.getAdminUsers.mockResolvedValue({ success: true, data: { stats: { total: 1, byRole: {} } } });
  notificationAPI.previewBroadcast.mockResolvedValue({ success: true, data: { count: 12 } });
  notificationAPI.broadcast.mockResolvedValue({ success: true, data: { count: 12 } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Dashboard />));
    const form = container.querySelector('form');
    expect(container.querySelector('button[type="submit"]').disabled).toBe(true);
    await act(async () => {
      const title = container.querySelector('#broadcastTitle');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(title, 'Important update');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      const audience = container.querySelector('#broadcastTargetRole');
      audience.value = 'moderator';
      audience.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(notificationAPI.previewBroadcast).toHaveBeenCalledWith('moderator');
    expect(notificationAPI.broadcast).not.toHaveBeenCalled();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Important update');
    const confirm = [...dialog.querySelectorAll('button')].find((button) => button.textContent === 'confirmSend');
    await act(async () => confirm.click());
    expect(notificationAPI.broadcast).toHaveBeenCalledTimes(1);
    expect(notificationAPI.broadcast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Important update', targetRole: 'moderator' }));
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
