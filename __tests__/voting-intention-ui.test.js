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
