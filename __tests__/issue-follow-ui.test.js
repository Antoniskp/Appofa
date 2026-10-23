/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api/issueFollows', () => ({ issueFollowAPI: { status: jest.fn(), set: jest.fn() } }));
const { useAuth } = require('@/lib/auth-context');
const { issueFollowAPI } = require('@/lib/api/issueFollows');
const Button = require('../components/IssueFollowButton').default;
let container, root;
beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 1 } });
  issueFollowAPI.status.mockResolvedValue({ data: { following: false } });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render() { await act(async () => root.render(React.createElement(Button, { entityType: 'poll', entityId: 65 }))); }
test('reading a page never subscribes the account', async () => {
  await render();
  expect(issueFollowAPI.status).toHaveBeenCalledWith('poll', 65);
  expect(issueFollowAPI.set).not.toHaveBeenCalled();
  expect(container.querySelector('button').getAttribute('aria-pressed')).toBe('false');
});
test('subscribes and unsubscribes only after explicit clicks', async () => {
  await render();
  issueFollowAPI.set.mockResolvedValueOnce({ data: { following: true } }).mockResolvedValueOnce({ data: { following: false } });
  await act(async () => container.querySelector('button').click());
  expect(issueFollowAPI.set).toHaveBeenLastCalledWith('poll', 65, true);
  expect(container.querySelector('button').getAttribute('aria-pressed')).toBe('true');
  await act(async () => container.querySelector('button').click());
  expect(issueFollowAPI.set).toHaveBeenLastCalledWith('poll', 65, false);
});
test('failed mutation leaves the current state and shows a retryable error', async () => {
  await render();
  issueFollowAPI.set.mockRejectedValue(new Error('Offline'));
  await act(async () => container.querySelector('button').click());
  expect(container.querySelector('[role="alert"]')).toBeTruthy();
  expect(container.querySelector('button').disabled).toBe(false);
  expect(container.querySelector('button').getAttribute('aria-pressed')).toBe('false');
});
test('guests return to the issue after login', async () => {
  useAuth.mockReturnValue({ user: null });
  await render();
  expect(container.querySelector('a').getAttribute('href')).toBe('/login?next=%2Fpolls%2F65');
  expect(issueFollowAPI.status).not.toHaveBeenCalled();
});
