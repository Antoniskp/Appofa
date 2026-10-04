/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }) => require('react').createElement('a', { href, ...props }, children) }));
const Summary = require('../components/locations/LocationActionSummary').default;

describe('Location activity preview', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  test('prioritizes active votes, then newest updates, with at most four real links', async () => {
    await act(async () => root.render(React.createElement(Summary, {
      polls: [
        { id: 1, title: 'Closed vote', status: 'closed', createdAt: '2026-10-03' },
        { id: 2, title: 'Active vote', status: 'active', createdAt: '2026-01-01' },
      ],
      suggestions: [{ id: 3, title: 'Older proposal', createdAt: '2026-09-01' }, { id: 4, title: 'New proposal', createdAt: '2026-10-02' }],
      news: [{ id: 5, title: 'Latest news', createdAt: '2026-10-03' }],
      articles: [{ id: 6, title: 'Old article', createdAt: '2026-08-01' }],
    })));
    expect([...container.querySelectorAll('h3')].map(el => el.textContent)).toEqual(['Active vote', 'Latest news', 'New proposal', 'Older proposal']);
    expect(container.querySelectorAll('a')).toHaveLength(4);
    expect(container.querySelector('a[href="/suggestions/4"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Closed vote');
    expect(container.textContent).not.toContain('Old article');
    expect(container.querySelector('a[href="/register"]')).toBeNull();
  });
  test('shows one quiet-state message without zero counters or repeated actions', async () => {
    await act(async () => root.render(React.createElement(Summary)));
    expect(container.textContent).toContain('πρώτη πρόταση');
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
  test('does not show an empty-state message while data is loading', async () => {
    await act(async () => root.render(React.createElement(Summary, { loading: true })));
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    expect(container.textContent).not.toContain('πρώτη πρόταση');
  });
});
