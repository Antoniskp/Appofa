/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }));
jest.mock('next/navigation', () => ({ usePathname: () => '/civic-questions' }));
jest.mock('next-intl', () => ({ useTranslations: () => (key, values) => values?.count !== undefined ? `${key}: ${values.count}` : key, useLocale: () => 'en' }));
jest.mock('@/lib/api', () => ({ civicQuestionAPI: { vote: jest.fn() } }));
const { civicQuestionAPI } = require('@/lib/api');
const Card = require('../components/civicQuestions/CivicQuestionCard').default;

const question = {
  id: 12, title: 'Do you agree with the proposed energy rules?', sourceType: 'parliament',
  status: 'open', creatorId: 1, resultsVisibility: 'always',
  totalVotes: 10, voteCounts: { agree: 6, disagree: 3, present: 1 },
  percentages: { agree: 60, disagree: 30, present: 10 }, myVote: null,
};

describe('Civic question cards', () => {
  let container, root;
  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const render = async (overrides = {}, props = {}) => act(async () => root.render(React.createElement(Card, { civicQuestion: { ...question, ...overrides }, user: { id: 2 }, ...props })));
  const buttons = () => [...container.querySelectorAll('button')];

  test('renders proportional green/red/neutral segments and separate links without nesting ballot controls', async () => {
    await render();
    const bar = container.querySelector('[role="img"]');
    expect([...bar.children].map(segment => segment.style.width)).toEqual(['60%', '30%', '10%']);
    expect(bar.children[0].className).toContain('bg-green-600');
    expect(bar.children[1].className).toContain('bg-red-600');
    expect(bar.getAttribute('aria-label')).toContain('card.unsure: 10%');
    expect(buttons()).toHaveLength(3);
    expect(container.querySelector('a button')).toBeNull();
    expect(container.querySelector('h3 a').getAttribute('href')).toBe('/civic-questions/12');
  });

  test('submits directly, updates the selected answer and bar, and allows changing a vote', async () => {
    const updated = { ...question, myVote: 'disagree', totalVotes: 11, voteCounts: { agree: 6, disagree: 4, present: 1 }, percentages: { agree: 55, disagree: 36, present: 9 } };
    const onVoteSuccess = jest.fn();
    civicQuestionAPI.vote.mockResolvedValue({ success: true, data: updated });
    await render({}, { onVoteSuccess });
    await act(async () => buttons()[1].click());
    expect(civicQuestionAPI.vote).toHaveBeenCalledWith(12, 'disagree');
    expect(onVoteSuccess).toHaveBeenCalledWith(updated);
    expect(container.querySelector('[role="status"]').textContent).toBe('card.vote_saved');
    await render(updated, { onVoteSuccess });
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('true');
    expect(parseFloat(container.querySelector('[role="img"]').children[1].style.width)).toBeCloseTo(4 / 11 * 100);
    await act(async () => buttons()[2].click());
    expect(civicQuestionAPI.vote).toHaveBeenLastCalledWith(12, 'present');
  });

  test('disables all answers while saving and reports a rejection without updating the results', async () => {
    let rejectVote;
    civicQuestionAPI.vote.mockImplementation(() => new Promise((resolve, reject) => { rejectVote = reject; }));
    const onVoteSuccess = jest.fn();
    await render({}, { onVoteSuccess });
    await act(async () => buttons()[0].click());
    expect(buttons().every(button => button.disabled)).toBe(true);
    await act(async () => rejectVote(new Error('Voting deadline has passed.')));
    expect(container.querySelector('[role="alert"]').textContent).toBe('Voting deadline has passed.');
    expect(onVoteSuccess).not.toHaveBeenCalled();
    expect(buttons().some(button => button.getAttribute('aria-pressed') === 'true')).toBe(false);
  });

  test('guests get a sign-in link and cannot cast votes', async () => {
    await render({}, { user: null });
    expect(buttons().every(button => button.disabled)).toBe(true);
    expect(container.querySelector('a[href="/login"]')).not.toBeNull();
    await act(async () => buttons()[0].click());
    expect(civicQuestionAPI.vote).not.toHaveBeenCalled();
  });

  test.each([
    { status: 'closed' }, { status: 'archived' }, { deadline: '2020-01-01T00:00:00Z' },
  ])('closed, archived and expired questions show results without ballot controls: %j', async overrides => {
    await render(overrides);
    expect(buttons()).toHaveLength(0);
    expect(container.querySelector('[role="img"]')).not.toBeNull();
  });

  test.each([
    { resultsVisibility: 'after_vote' }, { resultsVisibility: 'after_deadline' }, { canViewResults: false },
  ])('withholds restricted totals, proportions and button counts: %j', async overrides => {
    await render(overrides);
    expect(container.querySelector('[role="img"]')).toBeNull();
    expect(container.textContent).toContain('results_unavailable');
    expect(buttons().map(button => button.textContent)).toEqual(['choices.agree', 'choices.disagree', 'card.unsure']);
    expect(container.textContent).not.toContain('participation_count:');
  });

  test('shows results after voting or closing, and renders no artificial support for zero votes', async () => {
    await render({ resultsVisibility: 'after_vote', myVote: 'present' });
    expect(container.querySelector('[role="img"]')).not.toBeNull();
    await render({ resultsVisibility: 'after_deadline', status: 'closed' });
    expect(container.querySelector('[role="img"]')).not.toBeNull();
    await render({ totalVotes: 0, voteCounts: { agree: 0, disagree: 0, present: 0 }, percentages: { agree: 0, disagree: 0, present: 0 } });
    expect(container.querySelector('[role="img"]').getAttribute('aria-label')).toBe('card.no_votes');
    expect([...container.querySelector('[role="img"]').children].map(segment => segment.style.width)).toEqual(['0%', '0%', '0%']);
  });
});
