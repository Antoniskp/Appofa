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

  test('uses a wrapping footer row for metadata and vote controls', async () => {
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

    const footerRow = [...container.querySelectorAll('div')]
      .find((el) => el.className.includes('mt-auto') && el.className.includes('justify-between'));

    expect(footerRow).toBeTruthy();
    expect(footerRow.className).toContain('flex-wrap');

    await act(async () => {
      root.unmount();
    });
  });
});
