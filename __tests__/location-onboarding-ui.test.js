/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global document */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockUpdateProfile = jest.fn();
let mockUser;
const mockTranslate = (key) => key;
jest.mock('next-intl', () => ({ useTranslations: () => mockTranslate, useLocale: () => 'en' }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mockUser, updateProfile: mockUpdateProfile }) }));
jest.mock('@/lib/api', () => ({
  locationAPI: {
    getById: jest.fn(async () => ({ success: true, location: { id: 1, name: 'Greece', type: 'country' } })),
    getAll: jest.fn(async ({ type }) => ({
      success: true,
      locations: {
        country: [{ id: 1, name: 'Greece' }],
        prefecture: [{ id: 2, name: 'Attica' }],
        municipality: [{ id: 42, name: 'Athens' }],
      }[type] || [],
    })),
  },
}));
const LocationStep = require('../components/onboarding/LocationStep').default;
let root;
let container;
let next;
beforeEach(() => {
  mockUser = {};
  mockUpdateProfile.mockReset().mockResolvedValue({ success: true });
  next = jest.fn().mockResolvedValue();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function click(text) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === text);
  await act(async () => button.click());
}
async function selectLocation() {
  expect(container.querySelectorAll('select')).toHaveLength(1);
  for (const [index, value] of ['1', '2', '42'].entries()) {
    const select = container.querySelectorAll('select')[index];
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }));
    });
  }
}

test('saving a selected location advances setup', async () => {
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  expect(container.querySelector('input[type="checkbox"]').checked).toBe(false);
  await selectLocation();
  await click('saveLocation');
  expect(mockUpdateProfile).toHaveBeenCalledWith({ homeLocationId: 42, isDiaspora: false });
  expect(next).toHaveBeenCalledWith(42);
});
test('failed location save stays on step and displays an error', async () => {
  mockUpdateProfile.mockRejectedValue(new Error('Please retry'));
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  await selectLocation();
  await click('saveLocation');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Please retry');
  expect(next).not.toHaveBeenCalled();
});
test.each([
  ['skip', false],
  ['skipSelected', true],
])('%s advances without saving a location', async (label, hasSelection) => {
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  if (hasSelection) await selectLocation();
  await click(label);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(undefined);
  expect(mockUpdateProfile).not.toHaveBeenCalled();
});

test('can keep an existing location without saving it again', async () => {
  mockUser = { homeLocationId: 1, isDiaspora: false };
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  await click('continueSaved');
  expect(next).toHaveBeenCalledWith(undefined);
  expect(mockUpdateProfile).not.toHaveBeenCalled();
});
