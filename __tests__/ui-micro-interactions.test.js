/** @jest-environment jsdom */

/**
 * Tests for UI micro-interaction (vote-pop animation) and
 * Υπέρ/Κατά semantic card tints.
 */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Shared mocks ──────────────────────────────────────────────────────────────

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  suggestionAPI: { voteSuggestion: jest.fn() },
  civicQuestionAPI: { vote: jest.fn() },
}));

jest.mock('@/components/ui/RateLimitBanner', () => {
  const React = require('react');
  return function MockRateLimitBanner() {
    return React.createElement('div', { 'data-testid': 'rate-limit-banner' });
  };
});

const { useAuth } = require('@/lib/auth-context');
const { suggestionAPI, civicQuestionAPI } = require('@/lib/api');

// ── InlineSuggestionVote animation ────────────────────────────────────────────

describe('InlineSuggestionVote micro-interaction', () => {
  const InlineSuggestionVote = require('../components/InlineSuggestionVote').default;

  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.useFakeTimers();
    // Mock a logged-in user
    useAuth.mockReturnValue({ user: { id: 1, username: 'test' } });
    // voteSuggestion resolves with updated counts
    suggestionAPI.voteSuggestion.mockResolvedValue({
      success: true,
      data: { upvotes: 6, downvotes: 2, myVote: 1 },
    });
  });

  afterEach(async () => {
    jest.runAllTimers();
    await act(async () => { root.unmount(); });
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('upvote button receives animate-vote-pop class immediately on click', async () => {
    await act(async () => {
      root.render(
        React.createElement(InlineSuggestionVote, {
          suggestionId: 1,
          type: 'idea',
          initialUpvotes: 5,
          initialDownvotes: 2,
          initialMyVote: null,
        })
      );
    });

    const buttons = container.querySelectorAll('button');
    // First button is upvote
    const upBtn = buttons[0];
    expect(upBtn.className).not.toContain('animate-vote-pop');

    await act(async () => {
      upBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(upBtn.className).toContain('animate-vote-pop');
  });

  test('downvote button receives animate-vote-pop class immediately on click', async () => {
    await act(async () => {
      root.render(
        React.createElement(InlineSuggestionVote, {
          suggestionId: 1,
          type: 'idea',
          initialUpvotes: 5,
          initialDownvotes: 2,
          initialMyVote: null,
        })
      );
    });

    const buttons = container.querySelectorAll('button');
    const downBtn = buttons[1];
    expect(downBtn.className).not.toContain('animate-vote-pop');

    await act(async () => {
      downBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(downBtn.className).toContain('animate-vote-pop');
  });

  test('animate-vote-pop class is removed after 280ms timeout', async () => {
    await act(async () => {
      root.render(
        React.createElement(InlineSuggestionVote, {
          suggestionId: 1,
          type: 'idea',
          initialUpvotes: 5,
          initialDownvotes: 2,
          initialMyVote: null,
        })
      );
    });

    const upBtn = container.querySelectorAll('button')[0];

    await act(async () => {
      upBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(upBtn.className).toContain('animate-vote-pop');

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(upBtn.className).not.toContain('animate-vote-pop');
  });

  test('no animation when user is not logged in', async () => {
    useAuth.mockReturnValue({ user: null });

    await act(async () => {
      root.render(
        React.createElement(InlineSuggestionVote, {
          suggestionId: 1,
          type: 'idea',
          initialUpvotes: 5,
          initialDownvotes: 2,
          initialMyVote: null,
        })
      );
    });

    const upBtn = container.querySelectorAll('button')[0];

    await act(async () => {
      upBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(upBtn.className).not.toContain('animate-vote-pop');
  });
});

// ── CivicQuestionVoting animation ─────────────────────────────────────────────

describe('CivicQuestionVoting micro-interaction', () => {
  const CivicQuestionVoting = require('../components/civicQuestions/CivicQuestionVoting').default;

  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.useFakeTimers();
    civicQuestionAPI.vote.mockResolvedValue({ success: true, data: {} });
  });

  afterEach(async () => {
    jest.runAllTimers();
    await act(async () => { root.unmount(); });
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('clicked vote button receives animate-vote-pop class immediately', async () => {
    // Use voteRestriction: 'anyone' so the component renders vote buttons without requiring auth
    const civicQuestion = { id: 42, myVote: null, voteRestriction: 'anyone' };

    await act(async () => {
      root.render(
        React.createElement(CivicQuestionVoting, {
          civicQuestion,
          onVoteSuccess: jest.fn(),
        })
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const agreeBtn = buttons[0]; // first choice is 'agree'

    expect(agreeBtn.className).not.toContain('animate-vote-pop');

    await act(async () => {
      agreeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(agreeBtn.className).toContain('animate-vote-pop');
  });

  test('animate-vote-pop class is removed after 280ms timeout', async () => {
    // Use voteRestriction: 'anyone' so the component renders vote buttons without requiring auth
    const civicQuestion = { id: 42, myVote: null, voteRestriction: 'anyone' };

    await act(async () => {
      root.render(
        React.createElement(CivicQuestionVoting, {
          civicQuestion,
          onVoteSuccess: jest.fn(),
        })
      );
    });

    const agreeBtn = container.querySelectorAll('button')[0];

    await act(async () => {
      agreeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(agreeBtn.className).toContain('animate-vote-pop');

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(agreeBtn.className).not.toContain('animate-vote-pop');
  });
});
