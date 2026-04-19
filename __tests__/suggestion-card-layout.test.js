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

jest.mock('@/components/ui/Tooltip', () => ({
  TruncatedTextTooltip: ({ children }) => children,
}));

jest.mock('@/components/InlineSuggestionVote', () => {
  const React = require('react');
  return function MockInlineSuggestionVote() {
    return React.createElement('div', { 'data-testid': 'inline-vote' });
  };
});

jest.mock('@/components/user/UserAvatar', () => {
  const React = require('react');
  return function MockUserAvatar() {
    return React.createElement('div', { 'data-testid': 'user-avatar' });
  };
});

const SuggestionCard = require('../components/SuggestionCard').default;

describe('SuggestionCard layout', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('allows author metadata to shrink/truncate and keeps vote controls fixed', async () => {
    const suggestion = {
      id: 1,
      type: 'idea',
      title: 'Τίτλος',
      tags: [],
      upvotes: 1,
      downvotes: 0,
      myVote: null,
      author: { username: 'averyverylongusernamefortesting' },
      createdAt: '2026-04-19T00:00:00.000Z',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SuggestionCard, { suggestion }));
    });

    const username = [...container.querySelectorAll('span')].find((el) => el.textContent === suggestion.author.username);
    const voteRoot = container.querySelector('[data-testid="inline-vote"]');

    expect(username).toBeTruthy();
    expect(username.className).toContain('truncate');
    expect(username.closest('div').className).toContain('min-w-0');
    expect(voteRoot).toBeTruthy();
    expect(voteRoot.parentElement.className).toContain('shrink-0');

    await act(async () => {
      root.unmount();
    });
  });
});
