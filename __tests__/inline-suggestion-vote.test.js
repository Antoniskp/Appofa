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

// next-intl is mocked globally via __mocks__/next-intl.js
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

  test('shows RateLimitBanner and hides vote buttons after 429 error', async () => {
    const { useAuth } = require('@/lib/auth-context');
    useAuth.mockReturnValue({ user: { id: 1, username: 'tester' } });

    const { suggestionAPI } = require('@/lib/api');
    const rateLimitError = new Error('Too many votes from this IP, please try again later.');
    rateLimitError.status = 429;
    rateLimitError.retryAfter = 120;
    rateLimitError.resetTime = Date.now() + 120000;
    suggestionAPI.voteSuggestion.mockRejectedValueOnce(rateLimitError);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InlineSuggestionVote, {
        suggestionId: 2,
        type: 'idea',
        initialUpvotes: 3,
        initialDownvotes: 1,
        initialMyVote: null,
      }));
    });

    // Click upvote to trigger the rate-limited API call
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    await act(async () => {
      buttons[0].click();
    });

    // After the 429 error the vote buttons should be gone and the banner should be shown
    const remainingButtons = container.querySelectorAll('button');
    expect(remainingButtons.length).toBe(0); // banner has no buttons

    // Banner should be present (role="alert")
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
