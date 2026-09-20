/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) }));
jest.mock('@/lib/api', () => ({ suggestionAPI: { updateProgress: jest.fn() } }));
const { suggestionAPI } = require('@/lib/api');
const ProposalProgress = require('../components/ProposalProgress').default;
const proposal = { id: 12, authorId: 1, title: 'Proposal', progress: null };
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); jest.clearAllMocks(); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(user, onUpdated = jest.fn()) {
  await act(async () => root.render(React.createElement(ProposalProgress, { proposal, user, onUpdated })));
}
test('visitors and unrelated users cannot edit the timeline', async () => {
  await render(null);
  expect(container.querySelector('button')).toBeNull();
  await render({ id: 2, role: 'viewer' });
  expect(container.querySelector('button')).toBeNull();
});
test('author can publish a reasoned update and see the saved response', async () => {
  const onUpdated = jest.fn();
  const result = { progress: { revision: 1, stage: 'discussion', history: [] }, status: 'open' };
  suggestionAPI.updateProgress.mockResolvedValue({ success: true, data: result });
  await render({ id: 1, role: 'viewer' }, onUpdated);
  await act(async () => container.querySelector('button').click());
  const note = [...container.querySelectorAll('textarea')].at(-1);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(note, 'Started public discussion');
    note.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(suggestionAPI.updateProgress).toHaveBeenCalledWith(12, expect.objectContaining({ revision: 0, note: 'Started public discussion' }));
  expect(onUpdated).toHaveBeenCalledWith(result);
  expect(container.querySelector('form')).toBeNull();
});
test('failed saves retain the draft and display the error', async () => {
  suggestionAPI.updateProgress.mockRejectedValue(new Error('Progress changed. Reload before saving.'));
  await render({ id: 1, role: 'viewer' });
  await act(async () => container.querySelector('button').click());
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(container.querySelector('[role="alert"]').textContent).toContain('Progress changed');
  expect(container.querySelector('form')).not.toBeNull();
});
