/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useParams: () => ({ id: '1-sample-article' }),
  usePathname: () => '/articles/1-sample-article',
}));

jest.mock('@/hooks/useFetchArticle', () => ({
  useFetchArticle: () => ({
    loading: false,
    error: null,
    article: {
      id: 1,
      title: 'Sample Article',
      type: 'articles',
      category: 'Economy',
      tags: ['Tax', 'Budget'],
      summary: 'Summary',
      content: 'Content',
      createdAt: '2026-05-01T12:00:00.000Z',
      updatedAt: '2026-05-01T12:00:00.000Z',
      status: 'published',
      author: { username: 'writer' },
      hideAuthor: false,
      commentsEnabled: true,
      commentsLocked: false,
    },
  }),
}));

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ addToast: jest.fn(), error: jest.fn() }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canEditArticle: () => false }),
}));

jest.mock('@/lib/api', () => ({
  bookmarkAPI: {
    toggle: jest.fn().mockResolvedValue({ data: { bookmarked: false } }),
    getStatus: jest.fn().mockResolvedValue({ data: { bookmarked: false } }),
    getCount: jest.fn().mockResolvedValue({ data: { count: 0 } }),
  },
}));

jest.mock('@/components/comments/CommentsThread', () => {
  const React = require('react');
  return () => React.createElement('div', { 'data-testid': 'comments-thread' });
});
jest.mock('@/components/RichArticleContent', () => {
  const React = require('react');
  return ({ content }) => React.createElement('div', null, content);
});
jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'loading');
});
jest.mock('@/components/ReportButton', () => {
  const React = require('react');
  return () => React.createElement('button', { type: 'button' }, 'report');
});
jest.mock('@/components/ui/ShareModal', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'share');
});
jest.mock('@/components/articles/VideoEmbed', () => () => null);
jest.mock('@/components/user/UserAvatar', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'avatar');
});
jest.mock('@/components/ui/Tooltip', () => ({
  TruncatedTextTooltip: ({ children }) => children,
  TooltipIconButton: ({ onClick }) => {
    const React = require('react');
    return React.createElement('button', { type: 'button', onClick }, 'icon');
  },
}));

const ArticleCard = require('../components/articles/ArticleCard').default;
const ArticleDetailClient = require('../app/articles/[id]/ArticleDetailClient').default;

describe('Article taxonomy pill navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  test('ArticleCard renders type/category/tag pills as anchor links', async () => {
    const article = {
      id: 4,
      title: 'Sample',
      type: 'news',
      category: 'Economy',
      tags: ['Tax', 'Budget'],
      summary: 'Summary',
      content: 'Content',
      createdAt: '2026-05-01T12:00:00.000Z',
      author: { username: 'author' },
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ArticleCard, { article }));
    });

    expect(container.querySelector('a[href="/news"]')).toBeTruthy();
    expect(container.querySelector('a[href="/news?category=Economy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/news?tag=Tax"]')).toBeTruthy();
    expect(container.querySelector('a[href="/news?tag=Budget"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });

  test('Article detail page renders clickable taxonomy pills to filtered list routes', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ArticleDetailClient));
    });

    expect(container.querySelector('a[href="/articles"]')).toBeTruthy();
    expect(container.querySelector('a[href="/articles?category=Economy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/articles?tag=Tax"]')).toBeTruthy();
    expect(container.querySelector('a[href="/articles?tag=Budget"]')).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
  });
});
