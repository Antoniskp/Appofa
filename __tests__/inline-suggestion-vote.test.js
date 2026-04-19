/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(() => ({ user: null })),
}));

jest.mock('@/lib/api', () => ({
  suggestionAPI: {
    voteSuggestion: jest.fn(),
  },
}));

const InlineSuggestionVote = require('../components/InlineSuggestionVote').default;

describe('InlineSuggestionVote layout', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders vote controls', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InlineSuggestionVote, {
        suggestionId: 1,
        type: 'idea',
        initialUpvotes: 5,
        initialDownvotes: 2,
        initialMyVote: null,
      }));
    });

    expect(container.firstElementChild).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
