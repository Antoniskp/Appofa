/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const immediateTimers = [];
const originalFetch = global.fetch;

beforeAll(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: async () => ({ type: 'FeatureCollection', features: [] }),
  }));
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
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
  global.fetch = originalFetch;
  delete global.ResizeObserver;
});
const { createRoot } = require('react-dom/client');
const { ToastProvider } = require('../components/ToastProvider');

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
    })),
    getCategoryCounts: jest.fn(() => Promise.resolve({
      success: true,
      data: { counts: {} }
    }))
  },
  statsAPI: {
    getCommunityStats: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        totalLocations: 10,
        activeUsers: 5,
        areasNeedingModerators: 7,
        totalArticles: 20,
        totalPolls: 8,
        totalUsers: 42,
        totalVotes: 130,
        totalComments: 55,
        updatedAt: '2024-01-01T12:00:00.000Z'
      }
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
    })),
    getWorkerHealthStatus: jest.fn(() => Promise.resolve({
      success: true,
      data: { status: 200, latencyMs: 12, data: { ok: true } }
    })),
    sendWorkerTestSnapshot: jest.fn(() => Promise.resolve({
      success: true,
      data: { status: 202, latencyMs: 20, data: { accepted: true } }
    })),
    listWorkerTokens: jest.fn(() => Promise.resolve({
      success: true,
      data: []
    })),
    createWorkerToken: jest.fn(() => Promise.resolve({
      success: true,
      data: { id: 1, name: 'Worker token', token: 'appofa_wt_example' }
    })),
    revokeWorkerToken: jest.fn(() => Promise.resolve({
      success: true,
      data: { id: 1, revoked_at: '2026-05-14T14:00:00.000Z' }
    }))
  },
  tagAPI: {
    getSuggestions: jest.fn(() => Promise.resolve({ success: true, tags: [] }))
  },
  pollAPI: {
    getAll: jest.fn(() => Promise.resolve({ success: true, data: [] })),
    getCategoryCounts: jest.fn(() => Promise.resolve({ success: true, data: { counts: {} } })),
  },
  suggestionAPI: {
    getAll: jest.fn(() => Promise.resolve({ success: true, data: { suggestions: [] } })),
  },
  manifestAPI: {
    getAll: jest.fn(() => Promise.resolve({ success: true, data: { manifests: [] } })),
    getRandomSupporters: jest.fn(() => Promise.resolve({ success: true, data: { users: [] } })),
  },
  locationAPI: {
    getAll: jest.fn(() => Promise.resolve({ success: true, locations: [] })),
  },
  homepageSettingsAPI: {
    get: jest.fn(() => Promise.resolve({ success: true, data: null })),
  },
  geoAPI: {
    detect: jest.fn(() => Promise.resolve({ success: true, data: { countryCode: null, countryName: null } })),
  }
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => null)
  }))
}));

const { useAuth } = require('@/lib/auth-context');
const { geoAPI, locationAPI, pollAPI } = require('@/lib/api');

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

const setInputValue = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const setCheckboxValue = (input, checked) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;
  setter.call(input, checked);
  input.dispatchEvent(new Event('click', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const renderPage = async (Component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ToastProvider, null, React.createElement(Component)));
  });
  await act(async () => {
    await flushPromises();
  });

  return { container, root };
};

describe('Frontend smoke tests', () => {
  afterEach(() => {
    useAuth.mockReset();
    pollAPI.getAll.mockReset();
    pollAPI.getAll.mockResolvedValue({ success: true, data: [] });
    geoAPI.detect.mockReset();
    geoAPI.detect.mockResolvedValue({ success: true, data: { countryCode: null, countryName: null } });
    locationAPI.getAll.mockReset();
    locationAPI.getAll.mockResolvedValue({ success: true, locations: [] });
    mockSearchParams.get.mockReset();
    mockRouter.push.mockReset();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  test('renders home page hero and merged news/articles section', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Αποφάσεις που ξεκινούν από εσένα.');
    expect(container.textContent).toContain('Νέα & Άρθρα');

    await act(async () => {
      root.unmount();
    });
  });

  test('shows guest polls subtitle note and does not request dedicated open-polls feed', async () => {
    useAuth.mockReturnValue(buildAuthState({ user: null }));
    pollAPI.getAll.mockResolvedValue({ success: true, data: [] });

    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Μερικές ψηφοφορίες είναι ανοιχτές για όλους!');
    expect(container.textContent).not.toContain('Ψηφίστε χωρίς εγγραφή');
    expect(pollAPI.getAll).not.toHaveBeenCalledWith(expect.objectContaining({
      voteRestriction: 'anyone',
    }));

    await act(async () => {
      root.unmount();
    });
  });

  test('shows country suggestion popup only for unauthenticated non-GR visitors', async () => {
    useAuth.mockReturnValue(buildAuthState({ user: null }));
    geoAPI.detect.mockResolvedValue({
      success: true,
      data: { countryCode: 'DE', countryName: 'Germany' },
    });
    locationAPI.getAll.mockResolvedValue({
      success: true,
      locations: [{ code: 'DE', name: 'Germany', name_local: 'Germany' }],
    });

    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Θέλεις την τοπική έκδοση;');
    expect(container.textContent).toContain('Μετάβαση σε {country}');

    await act(async () => {
      root.unmount();
    });
  });

  test('does not show country suggestion popup for authenticated users', async () => {
    useAuth.mockReturnValue(buildAuthState({
      user: { id: 99, username: 'member' },
    }));
    geoAPI.detect.mockResolvedValue({
      success: true,
      data: { countryCode: 'DE', countryName: 'Germany' },
    });

    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).not.toContain('Θέλεις την τοπική έκδοση;');

    await act(async () => {
      root.unmount();
    });
  });

  test('persists country popup stay decision and does not re-open after decision exists', async () => {
    useAuth.mockReturnValue(buildAuthState({ user: null }));
    geoAPI.detect.mockResolvedValue({
      success: true,
      data: { countryCode: 'DE', countryName: 'Germany' },
    });
    locationAPI.getAll.mockResolvedValue({
      success: true,
      locations: [{ code: 'DE', name: 'Germany', name_local: 'Germany' }],
    });

    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    const stayButton = Array.from(container.querySelectorAll('button')).find((button) => (
      button.textContent.includes('Παραμονή στην αρχική')
    ));
    expect(stayButton).toBeTruthy();

    await act(async () => {
      stayButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    const storedDecision = JSON.parse(localStorage.getItem('appofa_country_entry_decision_v1'));
    expect(storedDecision.decision).toBe('stay');
    expect(container.textContent).not.toContain('Θέλεις την τοπική έκδοση;');

    await act(async () => {
      root.unmount();
    });

    geoAPI.detect.mockClear();

    const secondRender = await renderPage(HomePage);
    expect(secondRender.container.textContent).not.toContain('Θέλεις την τοπική έκδοση;');
    expect(geoAPI.detect).not.toHaveBeenCalled();

    await act(async () => {
      secondRender.root.unmount();
    });
  });

  test('renders articles page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const ArticlesPage = require('../app/articles/page').default;
    const { container, root } = await renderPage(ArticlesPage);

    expect(container.textContent).toContain('Όλες οι κατηγορίες');
    expect(container.textContent).toContain('Δεν βρέθηκαν άρθρα');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders news page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const NewsPage = require('../app/news/page').default;
    const { container, root } = await renderPage(NewsPage);

    expect(container.textContent).toContain('Όλες οι κατηγορίες');
    expect(container.textContent).toContain('Δεν υπάρχουν ειδήσεις');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders login page form', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState());
    const LoginPage = require('../app/login/page').default;
    const { container, root } = await renderPage(LoginPage);

    expect(container.textContent).toContain('Σύνδεση στον λογαριασμό σας');
    expect(container.textContent).toContain('Ή συνεχίστε με');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders register page form', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState());
    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    expect(container.textContent).toContain('Δημιουργία λογαριασμού');
    expect(container.textContent).toContain('Εγγραφείτε άμεσα με Google ή GitHub — χωρίς φόρμα');
    expect(container.textContent).toContain('Ή εγγραφή με email');
    expect(container.textContent).toContain('Επιβεβαίωση κωδικού');

    await act(async () => {
      root.unmount();
    });
  });

  test('register page wizard preselects Greece and shows step summary', async () => {
    mockSearchParams.get.mockReturnValue(null);
    geoAPI.detect.mockResolvedValue({
      success: true,
      data: { countryCode: 'GR', countryName: 'Greece' },
    });
    useAuth.mockReturnValue(buildAuthState());

    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    const passwordInput = container.querySelector('input[name="password"]');
    const confirmPasswordInput = container.querySelector('input[name="confirmPassword"]');

    await act(async () => {
      setInputValue(passwordInput, 'secret123');
      setInputValue(confirmPasswordInput, 'secret123');
      await flushPromises();
    });

    const nextButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.textContent.includes('Next')
    );

    await act(async () => {
      nextButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Η εθνικότητα μας βοηθάει να σου δείχνουμε σχετικά θέματα και στατιστικά.');
    expect(container.textContent).toContain('Δεν βρίσκεις τον δήμο σου; Επίλεξε τον νομό σου');

    const greekQuickSelectButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Είμαι Έλληνας / Ελληνίδα')
    );
    expect(greekQuickSelectButton.className).toContain('border-blue-500');

    const stepTwoNextButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Επόμενο')
    );

    await act(async () => {
      stepTwoNextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Σχεδόν έτοιμος/η! Ένα τελευταίο βήμα.');
    expect(container.textContent).toContain('Εθνικότητα: GR');

    await act(async () => {
      root.unmount();
    });
  });

  test('register page shows password validation before advancing from step 1', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState());
    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    const passwordInput = container.querySelector('input[name="password"]');
    const confirmPasswordInput = container.querySelector('input[name="confirmPassword"]');

    await act(async () => {
      setInputValue(passwordInput, '12345');
      passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
      setInputValue(confirmPasswordInput, '12345');
      confirmPasswordInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Ο κωδικός πρέπει να έχει τουλάχιστον {min} χαρακτήρες');

    const nextButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Next')
    );

    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).not.toContain('Η εθνικότητα μας βοηθάει να σου δείχνουμε σχετικά θέματα και στατιστικά.');

    await act(async () => {
      root.unmount();
    });
  });

  test('register page handles diaspora choices in step 2 instead of a submit modal', async () => {
    mockSearchParams.get.mockReturnValue(null);
    geoAPI.detect.mockResolvedValue({
      success: true,
      data: { countryCode: 'DE', countryName: 'Germany' },
    });
    const registerMock = jest.fn(() => Promise.resolve({ success: true }));
    useAuth.mockReturnValue(buildAuthState({ register: registerMock }));

    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    const usernameInput = container.querySelector('input[name="username"]');
    const emailInput = container.querySelector('input[name="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const confirmPasswordInput = container.querySelector('input[name="confirmPassword"]');

    await act(async () => {
      setInputValue(usernameInput, 'diasporatest');
      setInputValue(emailInput, 'diaspora@test.com');
      setInputValue(passwordInput, 'secret123');
      setInputValue(confirmPasswordInput, 'secret123');
      await flushPromises();
    });

    const accountNextButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Next')
    );

    await act(async () => {
      accountNextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Βρίσκεσαι εκτός Ελλάδας; Δήλωσέ το εδώ');
    expect(container.textContent).not.toContain('Είστε μέλος της Διασποράς;');

    const diasporaCheckbox = Array.from(container.querySelectorAll('input')).find(
      (input) => input.type === 'checkbox' && container.textContent.includes('Είμαι μέλος διασποράς')
    );

    await act(async () => {
      setCheckboxValue(diasporaCheckbox, true);
      await flushPromises();
    });

    const stepTwoNextButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Επόμενο')
    );

    await act(async () => {
      stepTwoNextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    const gdprConsent = container.querySelector('input[name="gdpr_consent"]');
    await act(async () => {
      setCheckboxValue(gdprConsent, true);
      await flushPromises();
    });

    const submitButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Δημιουργία λογαριασμού')
    );

    await act(async () => {
      submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
      isDiaspora: true,
      residenceCountryCode: 'DE',
    }));

    await act(async () => {
      root.unmount();
    });
  });

  test('register page allows selecting explicit profile visibility', async () => {
    mockSearchParams.get.mockReturnValue(null);
    const registerMock = jest.fn(() => Promise.resolve({ success: true }));
    useAuth.mockReturnValue(buildAuthState({ register: registerMock }));
    const RegisterPage = require('../app/register/page').default;
    const { container, root } = await renderPage(RegisterPage);

    await act(async () => {
      setInputValue(container.querySelector('input[name="username"]'), 'visibilityuser');
      setInputValue(container.querySelector('input[name="email"]'), 'visibility@test.com');
      setInputValue(container.querySelector('input[name="password"]'), 'secret123');
      setInputValue(container.querySelector('input[name="confirmPassword"]'), 'secret123');
      await flushPromises();
    });

    await act(async () => {
      const firstNext = Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes('Next'));
      firstNext.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    await act(async () => {
      const secondNext = Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes('Επόμενο'));
      secondNext.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    const publicVisibilityRadio = container.querySelector('input[name="profileVisibility"][value="public"]');
    await act(async () => {
      setCheckboxValue(publicVisibilityRadio, true);
      await flushPromises();
    });

    const gdprConsent = container.querySelector('input[name="gdpr_consent"]');
    await act(async () => {
      setCheckboxValue(gdprConsent, true);
      await flushPromises();
    });

    await act(async () => {
      const submitButton = Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent.includes('Δημιουργία λογαριασμού')
      );
      submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
      profileVisibility: 'public',
    }));

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

  test('renders admin worker status page for admin users', async () => {
    mockSearchParams.get.mockReturnValue(null);
    useAuth.mockReturnValue(buildAuthState({
      user: { role: 'admin', username: 'AdminUser', email: 'admin@test.com' }
    }));
    const WorkerStatusPage = require('../app/admin/worker-status/page').default;
    const { container, root } = await renderPage(WorkerStatusPage);

    expect(container.textContent).toContain('Worker Status');
    expect(container.textContent).toContain('Check health');
    expect(container.textContent).toContain('Send test snapshot');
    expect(container.textContent).toContain('Worker Tokens');
    expect(container.textContent).toContain('Create Token');

    await act(async () => {
      root.unmount();
    });
  });
});
