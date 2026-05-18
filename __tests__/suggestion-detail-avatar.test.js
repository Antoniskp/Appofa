/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockSuggestion = {
  id: 42,
  authorId: 10,
  type: 'idea',
  status: 'open',
  title: 'Test suggestion',
  body: 'Test body',
  createdAt: '2026-05-18T10:00:00.000Z',
  upvotes: 4,
  downvotes: 1,
  myVote: null,
  author: { id: 10, username: 'creatorUser' },
  solutions: [
    {
      id: 101,
      body: 'A possible solution',
      createdAt: '2026-05-18T11:00:00.000Z',
      upvotes: 2,
      downvotes: 0,
      myVote: null,
      author: { id: 11, username: 'solverUser' },
    },
  ],
};

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('@/lib/api', () => ({
  suggestionAPI: {
    getById: jest.fn(),
    voteSuggestion: jest.fn(),
    voteSolution: jest.fn(),
    createSolution: jest.fn(),
    delete: jest.fn(),
  },
}));

const useAsyncDataMock = jest.fn();
jest.mock('@/hooks/useAsyncData', () => ({
  useAsyncData: (...args) => useAsyncDataMock(...args),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 99, role: 'viewer' } }),
}));

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

jest.mock('@/components/ui/SkeletonLoader', () => () => null);
jest.mock('@/components/ui/EmptyState', () => () => null);
jest.mock('@/components/ui/Badge', () => ({ children }) => React.createElement('span', null, children));
jest.mock('@/components/ui/ConfirmDialog', () => () => null);
jest.mock('@/components/ui/Tooltip', () => ({
  TooltipIconButton: () => null,
}));
jest.mock('@/components/ui/ShareModal', () => () => null);
jest.mock('@/components/ui/LoginLink', () => ({ children }) => React.createElement('span', null, children));
jest.mock('@/components/user/UserAvatar', () => {
  const React = require('react');
  return function MockUserAvatar({ user }) {
    return React.createElement('div', { 'data-testid': 'user-avatar' }, user?.username || '');
  };
});

const SuggestionDetailPage = require('../app/suggestions/[id]/page').default;

describe('Suggestion detail author avatars', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    let delivered = false;
    useAsyncDataMock.mockImplementation((_, __, options = {}) => {
      if (!delivered) {
        delivered = true;
        options.onSuccess?.(mockSuggestion);
      }
      return { loading: false, error: '' };
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders suggestion creator and solution author with UserAvatar instead of @username text', async () => {
    await act(async () => {
      root.render(React.createElement(SuggestionDetailPage));
    });

    const avatars = container.querySelectorAll('[data-testid="user-avatar"]');
    expect(avatars).toHaveLength(2);
    expect(container.textContent).toContain('creatorUser');
    expect(container.textContent).toContain('solverUser');
    expect(container.textContent).not.toContain('@creatorUser');
    expect(container.textContent).not.toContain('@solverUser');
  });
});
