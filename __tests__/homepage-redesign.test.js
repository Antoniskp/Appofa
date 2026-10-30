/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockUser = null;
const mockGet = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, prefetch, ...props }) => require('react').createElement('a', { href, ...props }, children) }));
jest.mock('next/dynamic', () => loader => {
  const isMap = loader.toString().includes('ExploreLocationsMap');
  return props => require('react').createElement('div', { 'data-testid': isMap ? 'territory-map' : 'video' }, isMap ? props.prefectures.map(p => p.name).join(', ') : props.article.title);
});
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mockUser, loading: false }) }));
jest.mock('@/lib/api', () => ({
  homepageAPI: { get: (...args) => mockGet(...args) },
  suggestionAPI: { getProgress: jest.fn().mockResolvedValue({ success: true, data: [] }) },
}));
jest.mock('@/components/geo/CountryEntryPopup', () => () => null);
jest.mock('@/components/OnboardingCard', () => () => null);
jest.mock('@/components/HomeHero', () => props => require('react').createElement('div', { 'data-testid': 'original-hero' }, props.featuredPoll?.title));
jest.mock('@/components/HomeActionLanes', () => () => require('react').createElement('div', { 'data-testid': 'action-lanes' }));
jest.mock('@/components/GovernmentSnapshotSection', () => () => require('react').createElement('div', { 'data-testid': 'government' }));
jest.mock('@/components/SuggestionCard', () => ({ suggestion }) => require('react').createElement('p', null, suggestion.title));
jest.mock('@/components/polls/PollCard', () => ({ poll }) => require('react').createElement('p', null, poll.title));
jest.mock('@/components/articles/ArticleCard', () => ({ article }) => require('react').createElement('p', null, article.title));
const Home = require('../components/home/HomePageClient').default;
const payload = { suggestions: [{ id: 1, title: 'Public sample proposal' }], polls: [], latestNews: [{ id: 2, title: 'Local news', type: 'news' }], latestArticles: [{ id: 3, title: 'Community article', type: 'articles' }], videos: [{ id: 4, title: 'Community video' }], prefectures: [{ id: 12, name: 'Attica' }], manifestData: [{ slug: 'public-commitment', title: 'Public commitment', randomSupporters: [] }] };
describe('Restored map homepage', () => {
  let container, root;
  beforeEach(() => {
    mockUser = null;
    mockGet.mockReset().mockResolvedValue({ success: true, data: payload });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = async () => { await act(async () => root.render(React.createElement(Home))); };
  test('leads with news and polls, with secondary actions below the content', async () => {
    await render();
    for (const id of ['original-hero', 'territory-map', 'action-lanes']) expect(container.querySelector('[data-testid="' + id + '"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="government"]')).toBeNull();
    expect(container.textContent).not.toContain('Τι έγινε μετά τη συμμετοχή;');
    const sections = container.querySelectorAll('section');
    expect(sections[0].textContent).toContain('Local news');
    expect(sections[1].textContent).toContain('Δημοφιλείς δημοσκοπήσεις');
    expect(sections[1].compareDocumentPosition(container.querySelector('[data-testid="action-lanes"]')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const text of ['Attica', 'Local news', 'Community article', 'Community video', 'Public commitment']) expect(container.textContent).toContain(text);
    expect(container.querySelector('#home-area')).toBeNull();
  });
  test('preserves featured-poll audience settings', async () => {
    mockGet.mockResolvedValue({ success: true, data: { ...payload, featuredPoll: { title: 'Members poll' }, homepageSettings: { featuredPoll: { enabled: true, audience: 'registered' } } } });
    await render();
    expect(container.querySelector('[data-testid="original-hero"]').textContent).not.toContain('Members poll');
    mockUser = { id: 1, username: 'member' };
    await render();
    expect(container.querySelector('[data-testid="original-hero"]').textContent).toContain('Members poll');
  });
  test('shows a loading failure instead of silently rendering an empty response', async () => {
    mockGet.mockResolvedValue({ success: false, message: 'Homepage unavailable' });
    await render();
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.textContent).toContain('Σφάλμα φόρτωσης');
  });

  test('retries only a failed section and retains successful content', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: payload, errors: { polls: 'unavailable' } });
    await render();
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
    expect(container.textContent).toContain('Local news');
    mockGet.mockResolvedValueOnce({ success: true, data: { polls: [{ id: 9, title: 'Recovered poll' }] }, errors: {} });
    await act(async () => container.querySelector('[role="alert"] button').click());
    expect(mockGet).toHaveBeenLastCalledWith(undefined, ['polls']);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain('Recovered poll');
    expect(container.textContent).toContain('Local news');
  });

  test('keeps other errors after recovering from a network failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'));
    await render();
    mockGet.mockResolvedValueOnce({ success: true, data: { polls: [] }, errors: {} });
    await act(async () => container.querySelectorAll('[role="alert"] button')[1].click());
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(4);
  });

  test('discards a previous account response and clears private content on logout', async () => {
    let resolveOld;
    mockUser = { id: 7 };
    mockGet.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
    await render();
    mockUser = null;
    await render();
    await act(async () => resolveOld({ success: true, data: { suggestions: [{ id: 1, title: 'Private proposal' }] } }));
    expect(container.textContent).not.toContain('Private proposal');
    expect(container.textContent).toContain('Public sample proposal');
  });

  test('loads successfully in React Strict Mode', async () => {
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Home))));
    expect(container.textContent).toContain('Local news');
  });

  test('overlapping section retries retain both recovered results', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: payload, errors: { polls: 'unavailable', suggestions: 'unavailable' } });
    await render();
    let resolveFirst;
    mockGet.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }));
    await act(async () => container.querySelector('[role="alert"] button').click());
    mockGet.mockResolvedValueOnce({ success: true, data: { polls: [{ id: 1, title: 'Latest poll' }], suggestions: [{ id: 2, title: 'Recovered suggestion' }] } });
    await act(async () => container.querySelector('[role="alert"] button').click());
    expect(mockGet).toHaveBeenLastCalledWith(undefined, ['polls', 'suggestions']);
    await act(async () => resolveFirst({ success: true, data: { polls: [{ id: 3, title: 'Stale poll' }] } }));
    expect(container.textContent).toContain('Latest poll');
    expect(container.textContent).toContain('Recovered suggestion');
    expect(container.textContent).not.toContain('Stale poll');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
