/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }));
jest.mock('@/lib/api', () => ({
  pollAPI: { getVotingIntention: jest.fn(), createVotingIntention: jest.fn() },
  organizationAPI: { getAll: jest.fn() }
}));
const { pollAPI, organizationAPI } = require('@/lib/api');
const Notice = require('../components/polls/VotingIntentionNotice').default;
const Onboarding = require('../components/polls/VotingIntentionOnboarding').default;
const Setup = require('../components/polls/VotingIntentionSetup').default;
const Summary = require('../components/polls/VotingIntentionSummary').default;

describe('Voting intention entry points', () => {
  let container, root;
  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = async (Component, props = {}) => act(async () => root.render(React.createElement(Component, props)));

  test('homepage summary shows real proportions and links to the ballot without casting a vote', async () => {
    const poll = { id: 44, purpose: 'voting_intention', status: 'active', resultsVisibility: 'always', options: [
      { id: 1, text: 'ΠΑΣΟΚ', voteCount: 3 }, { id: 2, text: 'Δεν έχω αποφασίσει', voteCount: 1 }
    ] };
    await render(Summary, { poll });
    expect(container.querySelector('[role="img"]').getAttribute('aria-label')).toContain('ΠΑΣΟΚ: 75.0%');
    expect(container.querySelector('a').getAttribute('href')).toBe('/polls/44');
    expect(container.querySelector('button')).toBeNull();
    expect(new URL(container.querySelector('img').src).pathname).toBe('/images/parties/pasok.png');
    await render(Summary, { poll: { ...poll, userVote: { optionId: 1 } } });
    expect(container.querySelector('a').textContent).toBe('Αλλαγή ψήφου');
    await render(Summary, { poll: { ...poll, options: [] } });
    expect(container.textContent).toContain('Δεν έχουν καταχωριστεί ακόμη ψήφοι');
    await render(Summary, { poll: { ...poll, resultsVisibility: 'after_vote' } });
    expect(container.querySelector('[role="img"]')).toBeNull();
  });

  test('guest login returns to this ballot; linked accounts see no linking prompt', async () => {
    const poll = { id: 12, purpose: 'voting_intention' };
    await render(Notice, { poll });
    expect(container.querySelector('a').getAttribute('href')).toBe('/login?next=%2Fpolls%2F12');
    expect(container.textContent).toContain('όχι μοναδικό φυσικό πρόσωπο');
    await render(Notice, { poll, user: { id: 1 } });
    expect(container.querySelector('a').getAttribute('href')).toBe('/profile');
    await render(Notice, { poll: { ...poll, googleVotingEligible: true }, user: { id: 1 } });
    expect(container.querySelector('a')).toBeNull();
  });

  test('onboarding offers voluntary participation only for an available, unvoted round', async () => {
    pollAPI.getVotingIntention.mockResolvedValue({ success: true, data: { id: 12 } });
    await render(Onboarding);
    expect(container.textContent).toContain('Προαιρετική συμμετοχή');
    expect(container.querySelector('a').getAttribute('href')).toBe('/polls/12');
    await act(async () => root.render(null));
    pollAPI.getVotingIntention.mockResolvedValue({ success: true, data: { id: 12, userVote: { optionId: 1 } } });
    await render(Onboarding);
    expect(container.textContent).toBe('');
    await act(async () => root.render(null));
    pollAPI.getVotingIntention.mockResolvedValue({ success: true, data: null });
    await render(Onboarding);
    expect(container.textContent).toBe('');
  });

  test('setup loads existing parties and submits chosen IDs, excluding private organizations', async () => {
    organizationAPI.getAll.mockResolvedValue({ success: true, organizations: [
      { id: 1, name: 'Νέα Δημοκρατία', slug: 'nd', isPublic: true },
      { id: 2, name: 'ΠΑΣΟΚ', slug: 'pasok', isPublic: true },
      { id: 3, name: 'Private party', slug: 'private', isPublic: false }
    ], pagination: { totalPages: 1 } });
    pollAPI.createVotingIntention.mockResolvedValue({ success: true, data: { id: 12 } });
    const onCreated = jest.fn();
    await render(Setup, { onCreated });
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(2);
    expect(container.textContent).not.toContain('Private party');
    await act(async () => container.querySelector('button').click());
    expect(pollAPI.createVotingIntention).toHaveBeenCalledWith({ partyIds: [1, 2], deadline: null });
    expect(onCreated).toHaveBeenCalledWith(12);
    expect(container.textContent).toContain('Η ψηφοφορία δημιουργήθηκε');
  });
});
