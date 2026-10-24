/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockUpdateProfile = jest.fn();
const mockGetPreference = jest.fn();
const mockSavePreference = jest.fn();
const mockTranslate = (key) => key;
jest.mock('next-intl', () => ({ useTranslations: () => mockTranslate, useLocale: () => 'en' }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: {}, updateProfile: mockUpdateProfile }) }));
jest.mock('@/lib/api', () => ({ newsletterAPI: { getMyPreference: (...args) => mockGetPreference(...args), updateMyPreference: (...args) => mockSavePreference(...args) } }));
jest.mock('@/components/ui/LocationSelector', () => ({ __esModule: true, default: ({ onChange }) => React.createElement('button', { onClick: () => onChange(42) }, 'Pick city') }));
const LocationStep = require('../components/onboarding/LocationStep').default;
let root;
let container;
let next;
beforeEach(() => {
  mockUpdateProfile.mockReset().mockResolvedValue({ success: true });
  mockGetPreference.mockReset().mockResolvedValue({ success: true, data: { subscribed: false, preferences: { general: true, local: false, activity: false } } });
  mockSavePreference.mockReset();
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
test('saving a selected location advances without opting into email', async () => {
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  expect(container.querySelector('input[type="checkbox"]').checked).toBe(false);
  await click('Pick city');
  await click('saveLocation');
  expect(mockUpdateProfile).toHaveBeenCalledWith({ homeLocationId: 42, isDiaspora: false });
  expect(next).toHaveBeenCalledTimes(1);
  expect(mockSavePreference).not.toHaveBeenCalled();
});
test('failed location save stays on step and displays an error', async () => {
  mockUpdateProfile.mockRejectedValue(new Error('Please retry'));
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  await click('Pick city');
  await click('saveLocation');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Please retry');
  expect(next).not.toHaveBeenCalled();
});
test('skip does not alter the profile or subscription', async () => {
  await act(async () => root.render(React.createElement(LocationStep, { onContinue: next })));
  await click('skip');
  expect(next).toHaveBeenCalledTimes(1);
  expect(mockUpdateProfile).not.toHaveBeenCalled();
  expect(mockSavePreference).not.toHaveBeenCalled();
});
