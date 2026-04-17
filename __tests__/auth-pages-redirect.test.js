/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRouter = { push: jest.fn() };
const mockSearchParams = { get: jest.fn(() => null) };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams
}));

jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
  };
});

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/components/ToastProvider', () => {
  const React = require('react');
  return {
    useToast: () => ({
      success: jest.fn(),
      error: jest.fn()
    }),
    ToastProvider: ({ children }) => React.createElement(React.Fragment, null, children)
  };
});

jest.mock('@/hooks/useOAuthConfig', () => ({
  useOAuthConfig: () => ({
    config: { github: false, google: false, facebook: false }
  })
}));

jest.mock('@/components/ui/FormInput', () => {
  const React = require('react');
  return function FormInputMock(props) {
    return React.createElement('input', {
      name: props.name,
      type: props.type || 'text',
      value: props.value || '',
      onChange: props.onChange
    });
  };
});

jest.mock('@/components/ui/OAuthButtons', () => {
  const React = require('react');
  return function OAuthButtonsMock() {
    return React.createElement('div', null, 'oauth-buttons');
  };
});

jest.mock('@/components/ui/AuthDivider', () => {
  const React = require('react');
  return function AuthDividerMock() {
    return React.createElement('div', null, 'auth-divider');
  };
});

jest.mock('@/components/ui/Button', () => {
  const React = require('react');
  return function ButtonMock({ children, type = 'button' }) {
    return React.createElement('button', { type }, children);
  };
});

jest.mock('@/lib/api', () => ({
  authAPI: {
    getProfile: jest.fn(() => Promise.resolve({ success: true })),
    initiateGithubOAuth: jest.fn(() => Promise.resolve({ success: true })),
    initiateGoogleOAuth: jest.fn(() => Promise.resolve({ success: true }))
  }
}));

const { useAuth } = require('@/lib/auth-context');

const buildAuthState = (overrides = {}) => ({
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  ...overrides
});

const flushMicrotaskQueue = async () => {
  // Some page effects enqueue additional microtasks, so we flush twice.
  await Promise.resolve();
  await Promise.resolve();
};

const renderPage = async (Component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(Component));
  });
  await act(async () => {
    await flushMicrotaskQueue();
  });

  return { container, root };
};

describe('Auth pages redirect behavior', () => {
  afterEach(() => {
    useAuth.mockReset();
    mockRouter.push.mockReset();
    mockSearchParams.get.mockReset();
    mockSearchParams.get.mockReturnValue(null);
    localStorage.clear();
    document.body.innerHTML = '';
  });

  test('login page renders form but does not redirect while auth is loading', async () => {
    useAuth.mockReturnValue(buildAuthState({ loading: true }));
    const LoginPage = require('../app/login/page').default;

    const { container, root } = await renderPage(LoginPage);

    expect(container.textContent).toContain('Σύνδεση στον λογαριασμό σας');
    expect(mockRouter.push).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  test('login page redirects once for authenticated users after auth loading completes', async () => {
    useAuth.mockReturnValue(buildAuthState({ user: { id: 1 }, loading: false }));
    const LoginPage = require('../app/login/page').default;

    const { root } = await renderPage(LoginPage);

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/');

    await act(async () => {
      root.unmount();
    });
  });

  test('login page avoids redirecting authenticated users back to auth pages', async () => {
    localStorage.setItem('returnTo', '/login');
    useAuth.mockReturnValue(buildAuthState({ user: { id: 1 }, loading: false }));
    const LoginPage = require('../app/login/page').default;

    const { root } = await renderPage(LoginPage);

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/');

    await act(async () => {
      root.unmount();
    });
  });

  test('register page renders form but does not redirect while auth is loading', async () => {
    useAuth.mockReturnValue(buildAuthState({ loading: true }));
    const RegisterPage = require('../app/register/page').default;

    const { container, root } = await renderPage(RegisterPage);

    expect(container.textContent).toContain('Δημιουργία λογαριασμού');
    expect(mockRouter.push).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  test('register page redirects once for authenticated users after auth loading completes', async () => {
    useAuth.mockReturnValue(buildAuthState({ user: { id: 1 }, loading: false }));
    const RegisterPage = require('../app/register/page').default;

    const { root } = await renderPage(RegisterPage);

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/');

    await act(async () => {
      root.unmount();
    });
  });
});
