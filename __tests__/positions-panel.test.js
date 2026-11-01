/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }));
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => Object.assign(key => key, { has: () => false }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
jest.mock('@/components/ui/LoginLink', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/positions', () => ({ positionAPI: { metadata: jest.fn(), list: jest.fn(), vote: jest.fn() } }));
const { positionAPI } = require('@/lib/api/positions');
const PositionsPanel = require('@/components/positions/PositionsPanel').default;
const organization = { id: 1, name: 'Test party', slug: 'test', logo: '/party.png' };
const row = id => ({ id, positionId: id, title: `Proposal ${id}`, body: 'A proposal', sources: [], status: 'published', attribution: 'sourced', support: 2, oppose: 0, myVote: 1, position: { status: 'active', organization, category: { name: 'Housing', slug: 'housing' }, topics: [] } });

describe('position cards retain their place after voting', () => {
  let container, root;
  beforeEach(async () => {
    jest.clearAllMocks();
    positionAPI.metadata.mockResolvedValue({ data: { categories: [], topics: [], organizations: [organization] } });
    positionAPI.list.mockResolvedValue({ data: { positions: [row(1), row(2)], pagination: { total: 2, pages: 1 } } });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => { root.render(<PositionsPanel standalone />); });
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const button = (card, label) => [...card.querySelectorAll('button')].find(element => element.textContent.startsWith(label));
  test('switch and remove update counts without refetching, moving or remounting cards', async () => {
    const cards = [...container.querySelectorAll('article')];
    const reads = positionAPI.list.mock.calls.length;
    expect(cards[0].querySelector('img').getAttribute('src')).toBe('/party.png');
    positionAPI.vote.mockResolvedValueOnce({ data: { value: -1, support: 1, oppose: 1 } });
    await act(async () => button(cards[0], 'oppose').click());
    expect(button(cards[0], 'oppose').getAttribute('aria-pressed')).toBe('true');
    expect(button(cards[0], 'support').textContent).toBe('support1');
    positionAPI.vote.mockResolvedValueOnce({ data: { value: 0, support: 1, oppose: 0 } });
    await act(async () => button(cards[0], 'oppose').click());
    expect(positionAPI.vote).toHaveBeenLastCalledWith(1, 0);
    expect(button(cards[0], 'oppose').getAttribute('aria-pressed')).toBe('false');
    expect([...container.querySelectorAll('article')]).toEqual(cards);
    expect(positionAPI.list).toHaveBeenCalledTimes(reads);
    expect(cards[0].textContent).toContain('vote_removed');
  });
  test('failure leaves the vote intact and reports the error on that card', async () => {
    const card = container.querySelector('article');
    positionAPI.vote.mockRejectedValueOnce(new Error('Please retry'));
    await act(async () => button(card, 'oppose').click());
    expect(button(card, 'support').getAttribute('aria-pressed')).toBe('true');
    expect(card.querySelector('[role="alert"]').textContent).toBe('Please retry');
    expect(button(card, 'oppose').disabled).toBe(false);
  });
  test('comparison votes stay in place and remain current when returning to the list', async () => {
    await act(async () => root.render(<PositionsPanel standalone topicId={1} />));
    await act(async () => button(container, 'compare').click());
    await act(async () => container.querySelector('input[type="checkbox"]').click());
    const cards = [...container.querySelectorAll('article')];
    const reads = positionAPI.list.mock.calls.length;
    positionAPI.vote.mockResolvedValueOnce({ data: { value: -1, support: 1, oppose: 1 } });
    await act(async () => button(cards[0], 'oppose').click());
    expect([...container.querySelectorAll('article')]).toEqual(cards);
    expect(positionAPI.list).toHaveBeenCalledTimes(reads);
    await act(async () => button(container, 'list_view').click());
    expect(button(container.querySelector('article'), 'oppose').getAttribute('aria-pressed')).toBe('true');
  });
});
