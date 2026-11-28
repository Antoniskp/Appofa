/** @jest-environment <rootDir>/jest-jsdom-env.js */
/* global document, window */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => require('react').createElement('a', props, children) }));
jest.mock('@/hooks/useOAuthConfig', () => ({ useOAuthConfig: () => ({ config: { google: false, github: false } }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({
  authAPI: { requestEmailCode: jest.fn(), initiateGoogleOAuth: jest.fn() },
  pollAPI: { vote: jest.fn() },
}));

const { useAuth } = require('@/lib/auth-context');
const { authAPI, pollAPI } = require('@/lib/api');
const EmailCodeForm = require('../components/auth/EmailCodeForm').default;
const PollVoting = require('../components/polls/PollVoting').default;

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const setInputValue = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('email code sign-in and vote-before-sign-in', () => {
  let container;
  let root;
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = '';
  });

  test('sends a code, then signs in as soon as all six digits are entered', async () => {
    const signInWithEmailCode = jest.fn().mockResolvedValue({ success: true, data: { isNewUser: true, claimedVotes: 0 } });
    useAuth.mockReturnValue({ user: null, signInWithEmailCode });
    authAPI.requestEmailCode.mockResolvedValue({ success: true, data: { cooldownSeconds: 60 } });
    const onSuccess = jest.fn();

    await act(async () => root.render(React.createElement(EmailCodeForm, { onSuccess })));
    await act(async () => {
      setInputValue(container.querySelector('input[name="email"]'), ' person@example.com ');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await flush();
    });
    expect(authAPI.requestEmailCode).toHaveBeenCalledWith({ email: 'person@example.com', locale: 'el' });

    const codeInput = container.querySelector('input[name="code"]');
    expect(codeInput.getAttribute('autocomplete')).toBe('one-time-code');
    await act(async () => {
      setInputValue(codeInput, '123 456');
      await flush();
    });
    expect(signInWithEmailCode).toHaveBeenCalledWith({ email: 'person@example.com', code: '123456', locale: 'el' });
    expect(onSuccess).toHaveBeenCalledWith({ isNewUser: true, claimedVotes: 0 });
  });

  test('shows a clear message for a wrong code and stays on the code step', async () => {
    const error = Object.assign(new Error('bad'), { status: 400, code: 'EMAIL_CODE_INVALID' });
    useAuth.mockReturnValue({ user: null, signInWithEmailCode: jest.fn().mockRejectedValue(error) });
    authAPI.requestEmailCode.mockResolvedValue({ success: true, data: { cooldownSeconds: 60 } });

    await act(async () => root.render(React.createElement(EmailCodeForm, {})));
    await act(async () => {
      setInputValue(container.querySelector('input[name="email"]'), 'person@example.com');
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await flush();
    });
    await act(async () => {
      setInputValue(container.querySelector('input[name="code"]'), '000000');
      await flush();
    });
    expect(container.textContent).toContain('Ο κωδικός δεν είναι σωστός');
    expect(container.querySelector('input[name="code"]')).not.toBeNull();
  });

  test('a guest can pick an option on a members-only poll; the vote is sent right after signing in', async () => {
    const poll = {
      id: 7, status: 'active', type: 'simple', voteRestriction: 'authenticated',
      options: [{ id: 70, text: 'Ναι' }, { id: 71, text: 'Όχι' }],
    };
    useAuth.mockReturnValue({ user: null, signInWithEmailCode: jest.fn() });
    pollAPI.vote.mockResolvedValue({ success: true, data: {} });

    await act(async () => root.render(React.createElement(PollVoting, { poll })));
    expect(container.textContent).toContain('Θα σου ζητήσουμε μόνο email');

    await act(async () => {
      container.querySelectorAll('input[type="radio"]')[1].click();
    });
    const submit = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Υποβολή Ψήφου');
    await act(async () => { submit.click(); await flush(); });

    expect(pollAPI.vote).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Επιβεβαίωσε την ψήφο σου');
    expect(JSON.parse(sessionStorage.getItem('appofa_pending_vote'))).toMatchObject({ pollId: '7', optionId: 71 });

    useAuth.mockReturnValue({ user: { id: 5 }, signInWithEmailCode: jest.fn() });
    await act(async () => { root.render(React.createElement(PollVoting, { poll })); await flush(); });

    expect(pollAPI.vote).toHaveBeenCalledTimes(1);
    expect(pollAPI.vote).toHaveBeenCalledWith(7, 71, 'anonymous');
    expect(sessionStorage.getItem('appofa_pending_vote')).toBeNull();
  });

  test('closing the pop-up forgets the chosen option', async () => {
    const poll = { id: 8, status: 'active', type: 'binary', voteRestriction: 'authenticated', options: [{ id: 80, text: 'Ναι' }, { id: 81, text: 'Όχι' }] };
    useAuth.mockReturnValue({ user: null, signInWithEmailCode: jest.fn() });
    await act(async () => root.render(React.createElement(PollVoting, { poll })));
    const yes = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Ναι'));
    await act(async () => { yes.click(); await flush(); });
    expect(sessionStorage.getItem('appofa_pending_vote')).not.toBeNull();
    const close = document.body.querySelector('button[aria-label="Close modal"]');
    await act(async () => { close.click(); });
    expect(sessionStorage.getItem('appofa_pending_vote')).toBeNull();
    expect(pollAPI.vote).not.toHaveBeenCalled();
  });

  test('guests on open polls vote directly and are offered to keep the vote', async () => {
    const poll = { id: 9, status: 'active', type: 'binary', voteRestriction: 'anyone', options: [{ id: 90, text: 'Ναι' }, { id: 91, text: 'Όχι' }] };
    useAuth.mockReturnValue({ user: null, signInWithEmailCode: jest.fn() });
    pollAPI.vote.mockResolvedValue({ success: true, data: {} });
    await act(async () => root.render(React.createElement(PollVoting, { poll })));
    const yes = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Ναι'));
    await act(async () => { yes.click(); await flush(); });
    expect(pollAPI.vote).toHaveBeenCalledWith(9, 90, 'anonymous');
    const keep = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Κράτα την ψήφο μου');
    expect(keep).toBeTruthy();
    await act(async () => { keep.click(); });
    expect(document.body.textContent).toContain('Κράτα την ψήφο σου');
  });
});
