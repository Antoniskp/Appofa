/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockFindUsers = jest.fn();
const mockCreate = jest.fn();
const mockPush = jest.fn();
jest.mock('@/lib/api', () => ({ authAPI: { getAdminUsers: (...args) => mockFindUsers(...args) }, newsletterAPI: { adminCreateCampaign: (...args) => mockCreate(...args) } }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/components/ToastProvider', () => ({ useToast: () => ({ addToast: jest.fn() }) }));
jest.mock('@/components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/admin/AdminLayout', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/ui/LocationSelector', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/admin/NewsletterPollPicker', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/admin/NewsletterCivicQuestionPicker', () => ({ __esModule: true, default: () => null }));
const Picker = require('../components/admin/NewsletterRecipientPicker').default;
const CreatePage = require('../app/admin/newsletter/campaigns/new/page').default;
let root;
let container;
beforeEach(() => {
  jest.clearAllMocks();
  mockFindUsers.mockResolvedValue({ success: true, data: { users: [{ id: 42, username: 'member', email: 'member@test.com' }] } });
  mockCreate.mockResolvedValue({ success: true, data: { campaign: { id: 7 } } });
  window.history.replaceState(null, '', '/admin/newsletter/campaigns/new');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const change = async (element, value) => act(async () => {
  Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
});
const click = async (text) => act(async () => [...container.querySelectorAll('button')].find((item) => item.textContent === text).click());

test('individual selection searches registered accounts and switching back clears the selected user', async () => {
  let selection;
  function Harness() {
    const [value, setValue] = React.useState({ recipientMode: 'audience', recipientUserId: null });
    selection = value;
    return React.createElement(Picker, { value, onChange: (updates) => setValue((prev) => ({ ...prev, ...updates })) });
  }
  await act(async () => root.render(React.createElement(Harness)));
  await change(container.querySelector('select'), 'individual');
  expect(selection.recipientUserId).toBeNull();
  await change(container.querySelector('input'), 'member@test.com');
  await click('Find users');
  expect(mockFindUsers).toHaveBeenCalledWith({ search: 'member@test.com', placeholder: 'false', page: 1, limit: 10 });
  await act(async () => container.querySelector('button[aria-pressed]').click());
  expect(selection).toEqual({ recipientMode: 'individual', recipientUserId: 42 });
  expect(container.querySelector('[role="status"]').textContent).toContain('member@test.com');
  await change(container.querySelector('select'), 'audience');
  expect(selection.recipientUserId).toBeNull();
});

test('the user-row location shortcut creates a draft pinned to that user', async () => {
  window.history.replaceState(null, '', '/admin/newsletter/campaigns/new?template=profile_location_el&recipientUserId=42');
  await act(async () => root.render(React.createElement(CreatePage)));
  expect(container.textContent).toContain('user #42');
  expect(container.querySelector('#campaign-audience-locale')).toBeNull();
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ audienceFilters: expect.objectContaining({ purpose: 'profile_location', recipientMode: 'individual', recipientUserId: '42' }) }));
  expect(mockPush).toHaveBeenCalledWith('/admin/newsletter/campaigns/7');
});

test('individual mode without a selected user disables draft creation', async () => {
  await act(async () => root.render(React.createElement(CreatePage)));
  const mode = [...container.querySelectorAll('select')].find((item) => item.querySelector('option[value="individual"]'));
  await change(mode, 'individual');
  expect([...container.querySelectorAll('button')].find((item) => item.type === 'submit').disabled).toBe(true);
  expect(mockCreate).not.toHaveBeenCalled();
});
