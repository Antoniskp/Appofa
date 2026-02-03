/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react-dom/test-utils');
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null })
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/lib/api', () => ({
  authAPI: {
    getOAuthConfig: jest.fn(() => Promise.resolve({
      success: true,
      data: { github: false, google: false, facebook: false }
    }))
  },
  articleAPI: {
    getAll: jest.fn(() => Promise.resolve({
      success: true,
      data: { articles: [], pagination: { totalPages: 1 } }
    }))
  },
  locationAPI: {
    getAll: jest.fn(() => Promise.resolve({
      success: true,
      data: []
    }))
  },
  adminAPI: {
    getHealthStatus: jest.fn(() => Promise.resolve({
      success: true,
      status: 'healthy',
      timestamp: '2024-01-01T12:00:00.000Z',
      responseTimeMs: 12,
      uptime: 120,
      checks: {
        api: {
          status: 'healthy',
          responseTimeMs: 0,
          message: 'API responding'
        }
      }
    }))
  }
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

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const renderPage = async (Component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component));
    await flushPromises();
  });

  return { container, root };
};

describe('Frontend smoke tests', () => {
  afterEach(() => {
    useAuth.mockReset();
    document.body.innerHTML = '';
  });

  test('renders home page hero and latest news section', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Welcome to News App');
    expect(container.textContent).toContain('Latest News');

    root.unmount();
  });

  test('renders articles page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const ArticlesPage = require('../app/articles/page').default;
    const { container, root } = await renderPage(ArticlesPage);

    expect(container.textContent).toContain('Category');
    expect(container.textContent).toContain('Tag');

    root.unmount();
  });

  test('renders news page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const NewsPage = require('../app/news/page').default;
    const { container, root } = await renderPage(NewsPage);

    expect(container.textContent).toContain('Category');
    expect(container.textContent).toContain('No News Available');

    root.unmount();
  });

  test('renders login page form', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const LoginPage = require('../app/login/page').default;
    const { container, root } = await renderPage(LoginPage);

    expect(container.textContent).toContain('Sign in to your account');
    expect(container.textContent).toContain('Continue with GitHub');

    root.unmount();
  });

  test('renders register page form', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    expect(container.textContent).toContain('Create your account');
    expect(container.textContent).toContain('Confirm Password');

    root.unmount();
  });

  test('renders admin status page for admin users', async () => {
    useAuth.mockReturnValue(buildAuthState({
      user: { role: 'admin', username: 'AdminUser', email: 'admin@test.com' }
    }));
    const HealthStatusPage = require('../app/admin/status/page').default;
    const { container, root } = await renderPage(HealthStatusPage);

    expect(container.textContent).toContain('System Health');
    expect(container.textContent).toContain('Overall Status');

    root.unmount();
  });

  test('renders locations page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const LocationsPage = require('../app/locations/page').default;
    const { container, root } = await renderPage(LocationsPage);

    expect(container.textContent).toContain('Τοποθεσίες');
    expect(container.textContent).toContain('Αναζήτηση');

    root.unmount();
  });
});
