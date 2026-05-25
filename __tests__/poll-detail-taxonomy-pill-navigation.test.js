/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockPoll = {
  id: 9,
  title: 'Δοκιμαστική δημοσκόπηση',
  type: 'simple',
  status: 'active',
  category: 'Οικονομία',
  tags: ['φόρος', 'ανάπτυξη'],
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  creator: { username: 'admin' },
  creatorId: 1,
  visibility: 'public',
  options: [],
};

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '9-test' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isAdmin: false }),
}));

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ addToast: jest.fn(), error: jest.fn() }),
}));

jest.mock('@/components/comments/CommentsThread', () => {
  const React = require('react');
  return () => React.createElement('div', { 'data-testid': 'comments-thread' });
});
jest.mock('@/components/polls/PollVoting', () => {
  const React = require('react');
  return () => React.createElement('div', { 'data-testid': 'poll-voting' });
});
jest.mock('@/components/polls/PollResults', () => {
  const React = require('react');
  return () => React.createElement('div', { 'data-testid': 'poll-results' });
});
jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'loading');
});
jest.mock('@/components/ui/EmptyState', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'empty');
});
jest.mock('@/components/ui/Tooltip', () => ({
  TooltipIconButton: ({ onClick }) => {
    const React = require('react');
    return React.createElement('button', { type: 'button', onClick }, 'icon');
  },
}));
jest.mock('@/components/ReportButton', () => {
  const React = require('react');
  return () => React.createElement('button', { type: 'button' }, 'report');
});
jest.mock('@/components/ui/ShareModal', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'share');
});

jest.mock('@/lib/api', () => ({
  pollAPI: {
    getById: jest.fn().mockResolvedValue({ success: true, data: mockPoll }),
    vote: jest.fn(),
  },
  bookmarkAPI: {
    getStatus: jest.fn().mockResolvedValue({ data: { bookmarked: false } }),
    getCount: jest.fn().mockResolvedValue({ data: { count: 0 } }),
    toggle: jest.fn().mockResolvedValue({ data: { bookmarked: false } }),
  },
}));

const PollDetailPage = require('../app/polls/[id]/page').default;

describe('Poll detail taxonomy pill navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders clickable type/category/tag pills that point to polls listing filters', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(PollDetailPage));
    });

    await act(async () => {
      await Promise.resolve();
    });

    const hrefs = [...container.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/polls');
    expect(hrefs).toContain(`/polls?category=${encodeURIComponent(mockPoll.category)}`);
    expect(hrefs).toContain(`/polls?tag=${encodeURIComponent(mockPoll.tags[0])}`);
    expect(hrefs).toContain(`/polls?tag=${encodeURIComponent(mockPoll.tags[1])}`);

    await act(async () => {
      root.unmount();
    });
  });
});
