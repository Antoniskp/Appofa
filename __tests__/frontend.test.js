/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const immediateTimers = [];

beforeAll(() => {
  jest.useFakeTimers();
  global.setTimeout = (callback, delay) => {
    if (typeof callback === 'function') {
      immediateTimers.push(() => callback(delay));
    }
    return immediateTimers.length;
  };
  global.clearTimeout = () => {};
});

afterAll(() => {
  immediateTimers.splice(0, immediateTimers.length);
  jest.useRealTimers();
});
const { createRoot } = require('react-dom/client');

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
  };
});

jest.mock('next/image', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ src, alt, ...props }) => React.createElement('img', { src, alt, ...props })
  };
});

const mockRouter = { push: jest.fn() };
const mockSearchParams = { get: jest.fn(() => null) };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => mockSearchParams
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/lib/api', () => ({
  authAPI: {
    getOAuthConfig: jest.fn(() => Promise.resolve({
      success: true,
      data: { github: false, google: false, facebook: false }
    })),
    getProfile: jest.fn(() => Promise.resolve({
      success: true,
      data: { user: null }
    }))
  },
  articleAPI: {
    getAll: jest.fn(() => Promise.resolve({
      success: true,
      data: { articles: [], pagination: { totalPages: 1 } }
    }))
  },
  adminAPI: {
    getHealthStatus: jest.fn(() => Promise.resolve({
      success: true,
      status: 'healthy',
      timestamp: '2024-01-01T12:00:00.000Z',
      responseTimeMs: 12,
      uptime: 120,
      infrastructureChecks: {
        api: {
          status: 'healthy',
          responseTimeMs: 0,
          message: 'API responding'
        },
        database: {
          status: 'healthy',
          responseTimeMs: 5,
          message: 'Database connection successful'
        }
      },
      functionalChecks: {
        articleRead: {
          status: 'healthy',
          responseTimeMs: 8,
          message: 'Article retrieval working',
          count: 10
        },
        authValidation: {
          status: 'healthy',
          responseTimeMs: 3,
          message: 'User authentication ready',
          activeUsers: 5
        },
        pollRead: {
          status: 'healthy',
          responseTimeMs: 6,
          message: 'Poll retrieval working',
          count: 5,
          activePolls: 3
        },
        pollVoting: {
          status: 'healthy',
          responseTimeMs: 4,
          message: 'Poll voting functionality ready',
          totalVotes: 15
        }
      }
    }))
  }
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => null)
  }))
}));

const { useAuth } = require('@/lib/auth-context');

const buildAuthState = (overrides = {}) => ({
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  ...overrides
});

const flushPromises = async () => {
  await Promise.resolve();
  while (immediateTimers.length) {
    const pending = immediateTimers.splice(0, immediateTimers.length);
    pending.forEach((callback) => callback());
  }
};

const renderPage = async (Component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component));
  });
  await act(async () => {
    await flushPromises();
  });

  return { container, root };
};

describe('Frontend smoke tests', () => {
  afterEach(() => {
    useAuth.mockReset();
    mockSearchParams.get.mockReset();
    mockRouter.push.mockReset();
    document.body.innerHTML = '';
  });

  test('renders home page hero and latest news section', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Welcome to News App');
    expect(container.textContent).toContain('Latest News');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders articles page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const ArticlesPage = require('../app/articles/page').default;
    const { container, root } = await renderPage(ArticlesPage);

    expect(container.textContent).toContain('Category');
    expect(container.textContent).toContain('Tag');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders news page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const NewsPage = require('../app/news/page').default;
    const { container, root } = await renderPage(NewsPage);

    expect(container.textContent).toContain('Category');
    expect(container.textContent).toContain('No News Available');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders login page form', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState());
    const LoginPage = require('../app/login/page').default;
    const { container, root } = await renderPage(LoginPage);

    expect(container.textContent).toContain('Sign in to your account');
    expect(container.textContent).toContain('Continue with GitHub');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders register page form', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState());
    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    expect(container.textContent).toContain('Create your account');
    expect(container.textContent).toContain('Confirm Password');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders admin status page for admin users', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState({
      user: { role: 'admin', username: 'AdminUser', email: 'admin@test.com' }
    }));
    const HealthStatusPage = require('../app/admin/status/page').default;
    const { container, root } = await renderPage(HealthStatusPage);

    expect(container.textContent).toContain('System Health');
    expect(container.textContent).toContain('Overall Status');

    await act(async () => {
      root.unmount();
    });
  });
});
