/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('@/components/user/UserRow', () => () => null);
jest.mock('@/components/ui/LoginLink', () => ({ children }) => React.createElement('span', null, children));
jest.mock('@/components/locations/LocationElectionsTab', () => () => null);

const LocationTabs = require('../components/locations/LocationTabs').default;

describe('LocationTabs suggestion anonymity', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('shows anonymous metadata for hidden suggestion creators', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(LocationTabs, {
        activeTab: 'suggestions',
        onTabChange: () => {},
        activePolls: [],
        newsArticles: [],
        regularArticles: [],
        entities: { usersCount: 0, users: [], unclaimedCount: 0, unclaimed: [] },
        suggestions: [
          {
            id: 11,
            title: 'Κρυφή πρόταση',
            body: 'Σύντομη περιγραφή',
            type: 'idea',
            status: 'open',
            hideCreator: true,
            author: null,
            createdAt: '2026-05-18T00:00:00.000Z',
          },
        ],
        isAuthenticated: false,
        locationIdentifier: 'attica',
        TAB_LABELS: {
          polls: 'Polls',
          news: 'News',
          articles: 'Articles',
          users: 'Users',
          unclaimed: 'Unclaimed',
          suggestions: 'Suggestions',
          elections: 'Elections',
        },
        visibleTabs: ['suggestions'],
        loading: false,
      }));
    });

    expect(container.textContent).toContain('by Anonymous');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders polls in compact grid layout and explicit empty CTA copy', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(LocationTabs, {
        activeTab: 'polls',
        onTabChange: () => {},
        activePolls: [
          {
            id: 21,
            title: 'Τοπική ψηφοφορία 1',
            description: 'Περιγραφή',
            status: 'open',
            createdAt: '2026-05-18T00:00:00.000Z',
          },
          {
            id: 22,
            title: 'Τοπική ψηφοφορία 2',
            description: 'Περιγραφή',
            status: 'open',
            createdAt: '2026-05-19T00:00:00.000Z',
          },
        ],
        newsArticles: [],
        regularArticles: [],
        entities: { usersCount: 0, users: [], unclaimedCount: 0, unclaimed: [] },
        suggestions: [],
        isAuthenticated: false,
        locationIdentifier: 'attica',
        TAB_LABELS: {
          polls: 'Polls',
          news: 'News',
          articles: 'Articles',
          users: 'Users',
          unclaimed: 'Unclaimed',
          suggestions: 'Suggestions',
          elections: 'Elections',
        },
        visibleTabs: ['polls'],
        loading: false,
      }));
    });

    expect(container.querySelector('.grid.gap-3.md\\:grid-cols-2')).toBeTruthy();

    await act(async () => {
      root.render(React.createElement(LocationTabs, {
        activeTab: 'polls',
        onTabChange: () => {},
        activePolls: [],
        newsArticles: [],
        regularArticles: [],
        entities: { usersCount: 0, users: [], unclaimedCount: 0, unclaimed: [] },
        suggestions: [],
        isAuthenticated: false,
        locationIdentifier: 'attica',
        TAB_LABELS: {
          polls: 'Polls',
          news: 'News',
          articles: 'Articles',
          users: 'Users',
          unclaimed: 'Unclaimed',
          suggestions: 'Suggestions',
          elections: 'Elections',
        },
        visibleTabs: ['polls'],
        loading: false,
      }));
    });

    expect(container.textContent).toContain('+ Ξεκίνησε ψηφοφορία');

    await act(async () => {
      root.unmount();
    });
  });
});
