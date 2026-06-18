/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@/components/ui/Card', () => {
  const React = require('react');
  const Card = ({ children, className }) => React.createElement('div', { className }, children);
  const ImageTopCard = ({ children, className }) => React.createElement('div', { className }, children);
  return {
    __esModule: true,
    default: Card,
    ImageTopCard,
  };
});

jest.mock('@/components/ui/Badge', () => {
  const React = require('react');
  return function MockBadge({ children }) {
    return React.createElement('span', null, children);
  };
});

jest.mock('@/components/ui/Tooltip', () => ({
  TruncatedTextTooltip: ({ children }) => children,
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isAdmin: false }),
}));

jest.mock('@/lib/api', () => ({
  pollAPI: {
    vote: jest.fn(),
  },
}));

jest.mock('@/components/user/UserAvatar', () => {
  const React = require('react');
  return function MockUserAvatar() {
    return React.createElement('div', { 'data-testid': 'user-avatar' });
  };
});

const PollCard = require('../components/polls/PollCard').default;

describe('PollCard organization identity', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders organization logo and name for official organization polls', async () => {
    const poll = {
      id: 101,
      title: 'Επίσημη δημοσκόπηση',
      description: 'Περιγραφή',
      type: 'simple',
      status: 'closed',
      createdAt: '2026-05-18T10:00:00.000Z',
      options: [{ id: 1, text: 'Ναι', voteCount: 1 }, { id: 2, text: 'Όχι', voteCount: 0 }],
      totalVotes: 1,
      visibility: 'public',
      voteRestriction: 'anyone',
      resultsVisibility: 'always',
      creator: { username: 'normal_user' },
      isOfficialPost: true,
      organization: {
        name: 'Οργάνωση Δημοσκοπήσεων',
        logo: 'https://example.com/poll-org-logo.png',
      },
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(PollCard, { poll }));
    });

    expect(container.textContent).toContain('Οργάνωση Δημοσκοπήσεων');
    expect(container.querySelector('img[src="https://example.com/poll-org-logo.png"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="user-avatar"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });
});
