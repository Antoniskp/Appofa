/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockUser = null;
const mockGet = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => require('react').createElement('a', { href, ...props }, children) }));
jest.mock('next/dynamic', () => loader => {
  const isMap = loader.toString().includes('ExploreLocationsMap');
  return props => require('react').createElement('div', { 'data-testid': isMap ? 'territory-map' : 'video' }, isMap ? props.prefectures.map(p => p.name).join(', ') : props.article.title);
});
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mockUser, loading: false }) }));
jest.mock('@/lib/api', () => ({ homepageAPI: { get: (...args) => mockGet(...args) } }));
jest.mock('@/components/geo/CountryEntryPopup', () => () => null);
jest.mock('@/components/OnboardingCard', () => () => null);
jest.mock('@/components/HomeHero', () => props => require('react').createElement('div', { 'data-testid': 'original-hero' }, props.featuredPoll?.title));
jest.mock('@/components/HomeActionLanes', () => () => require('react').createElement('div', { 'data-testid': 'action-lanes' }));
jest.mock('@/components/GovernmentSnapshotSection', () => () => require('react').createElement('div', { 'data-testid': 'government' }));
jest.mock('@/components/SuggestionCard', () => ({ suggestion }) => require('react').createElement('p', null, suggestion.title));
jest.mock('@/components/polls/PollCard', () => ({ poll }) => require('react').createElement('p', null, poll.title));
jest.mock('@/components/articles/ArticleCard', () => ({ article }) => require('react').createElement('p', null, article.title));
const Home = require('../app/page').default;
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
  test('restores the original hero, map, government overview, articles, videos and supporters', async () => {
    await render();
    for (const id of ['original-hero', 'territory-map', 'action-lanes', 'government']) expect(container.querySelector('[data-testid="' + id + '"]')).toBeTruthy();
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
    expect(container.textContent).toContain('Homepage unavailable');
  });
});
