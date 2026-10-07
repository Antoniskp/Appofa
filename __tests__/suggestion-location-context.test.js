/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next-intl', () => ({ useTranslations: () => key => key, useLocale: () => 'el' }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 1, homeLocationId: 7 } }) }));
jest.mock('@/components/ToastProvider', () => ({ useToast: () => ({ addToast: jest.fn() }) }));
jest.mock('@/lib/api', () => ({ suggestionAPI: {}, tagAPI: { getSuggestions: jest.fn().mockResolvedValue({ tags: [] }) } }));
jest.mock('@/lib/api/suggestions', () => ({ suggestionAPI: { getRecipients: jest.fn().mockResolvedValue({ success: true, data: [] }) } }));
jest.mock('@/components/ui/TagInput', () => () => null);
jest.mock('@/components/ui/CascadingLocationSelector', () => ({ value, onChange }) => require('react').createElement('button', { type: 'button', 'data-testid': 'location', onClick: () => onChange(null) }, String(value)));
const Page = require('../app/suggestions/new/page').default;

describe('Location proposal context', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); window.history.replaceState({}, '', '/'); });
  test('prefills the requested location over home location and permits clearing it', async () => {
    window.history.replaceState({}, '', '/suggestions/new?locationId=101');
    await act(async () => root.render(React.createElement(Page)));
    const selector = container.querySelector('[data-testid="location"]');
    expect(selector.textContent).toBe('101');
    await act(async () => selector.click());
    expect(selector.textContent).toBe('null');
  });
  test.each(['', '?locationId=invalid', '?locationId=-3'])('falls back to home location for %s', async query => {
    window.history.replaceState({}, '', '/suggestions/new' + query);
    await act(async () => root.render(React.createElement(Page)));
    expect(container.querySelector('[data-testid="location"]').textContent).toBe('7');
  });
});
