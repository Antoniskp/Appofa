/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockUser = null;
const mockGet = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => require('react').createElement('a', { href, ...props }, children) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mockUser, loading: false }) }));
jest.mock('@/lib/api', () => ({ homepageAPI: { get: (...args) => mockGet(...args) } }));
jest.mock('@/components/geo/CountryEntryPopup', () => () => null);
jest.mock('@/components/OnboardingCard', () => () => null);
jest.mock('@/components/ProgressFeed', () => () => null);
jest.mock('@/components/SuggestionCard', () => ({ suggestion }) => require('react').createElement('p', null, suggestion.title));
jest.mock('@/components/polls/PollCard', () => ({ poll }) => require('react').createElement('p', null, poll.title));
const Home = require('../app/page').default;
const payload = { suggestions: [{ id: 1, title: 'Public sample proposal', location: { name: 'Athens' } }], polls: [], latestNews: [], prefectures: [{ id: 12, name: 'Attica' }] };
describe('Community-first homepage', () => {
  let container, root;
  beforeEach(() => {
    mockUser = null;
    mockGet.mockReset().mockResolvedValue({ success: true, data: payload });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = async () => { await act(async () => { root.render(React.createElement(Home)); }); };
  test('shows a real featured proposal for guests and preserves scope in discovery links', async () => {
    await render();
    expect(container.querySelector('aside a').getAttribute('href')).toBe('/suggestions/1');
    expect(mockGet).toHaveBeenLastCalledWith('');
    const select = container.querySelector('#home-area');
    await act(async () => { select.value = '12'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(mockGet).toHaveBeenLastCalledWith('12');
    expect(container.querySelector('a[href="/suggestions?locationId=12"]')).toBeTruthy();
    expect(container.querySelector('a[href="/polls?locationId=12"]')).toBeTruthy();
  });
  test('gives returning members a compact home-area view', async () => {
    mockUser = { id: 7, username: 'citizen', homeLocation: { id: 5, name: 'Athens', slug: 'athens' } };
    await render();
    expect(mockGet).toHaveBeenLastCalledWith('5');
    expect(container.querySelector('aside')).toBeNull();
    expect(container.querySelector('a[href="/locations/athens"]')).toBeTruthy();
    expect(container.querySelector('#home-area').value).toBe('5');
  });
  test('does not leave old-area proposals visible when a new area fails', async () => {
    await render();
    mockGet.mockRejectedValueOnce(new Error('Area unavailable'));
    const select = container.querySelector('#home-area');
    await act(async () => { select.value = '12'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.textContent).toContain('Area unavailable');
    expect(container.textContent).not.toContain('Public sample proposal');
  });
});
