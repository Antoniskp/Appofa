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

jest.mock('next-intl', () => ({
  useTranslations: (namespace) => {
    const messages = {
      auth: {
        login_title: 'Σύνδεση στον λογαριασμό σας',
        register_title: 'Δημιουργία λογαριασμού',
        already_have_account: 'Έχετε ήδη λογαριασμό;',
        submit_login: 'Σύνδεση',
        or_register_with: 'Ή εγγραφή με',
        username: 'Όνομα χρήστη',
        email: 'Διεύθυνση email',
        first_name: 'Όνομα',
        last_name: 'Επώνυμο',
        password: 'Κωδικός πρόσβασης',
        confirm_password: 'Επιβεβαίωση κωδικού',
        searchable: 'Να με βρίσκουν άλλοι χρήστες στην αναζήτηση',
        submit_register: 'Δημιουργία λογαριασμού',
        register_success: 'Ο λογαριασμός δημιουργήθηκε! Καλώς ήρθατε!',
        register_fail: 'Αποτυχία εγγραφής. Παρακαλώ δοκιμάστε ξανά.',
        passwords_no_match: 'Οι κωδικοί δεν ταιριάζουν',
        github_fail: 'Αποτυχία εκκίνησης εγγραφής με GitHub',
        google_fail: 'Αποτυχία εκκίνησης εγγραφής με Google',
      },
      common: {
        loading: 'Φόρτωση...',
      },
    };

    return (key) => messages[namespace]?.[key] || key;
  },
}));

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
  },
  geoAPI: {
    detect: jest.fn(() => Promise.resolve({ success: true, data: { countryCode: null, countryName: null } })),
  }
}));

const { useAuth } = require('@/lib/auth-context');
const { geoAPI } = require('@/lib/api');

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
    geoAPI.detect.mockReset();
    geoAPI.detect.mockResolvedValue({ success: true, data: { countryCode: null, countryName: null } });
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

  test('register page stores detected country cookie after geo detection', async () => {
    geoAPI.detect.mockResolvedValue({ success: true, data: { countryCode: 'DE', countryName: 'Germany' } });
    useAuth.mockReturnValue(buildAuthState({ user: null, loading: false }));
    const RegisterPage = require('../app/register/page').default;

    const { root } = await renderPage(RegisterPage);

    expect(document.cookie).toContain('appofa_detected_country=DE');

    await act(async () => {
      root.unmount();
    });
  });
});
