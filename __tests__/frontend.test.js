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

jest.mock('next-intl', () => ({
  useTranslations: (namespace) => {
    const messages = {
      home: {
        latest_articles_title: 'Τελευταία Άρθρα',
        latest_articles_subtitle: 'Αναλύσεις και απόψεις από την κοινότητα',
        empty_articles_title: 'Δεν βρέθηκαν άρθρα',
        empty_articles_description: 'Δεν υπάρχουν άρθρα αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!',
        top_suggestions_title: 'Κορυφαίες Προτάσεις',
        top_suggestions_subtitle: 'Οι πιο δημοφιλείς προτάσεις πολιτών',
        empty_suggestions_title: 'Δεν βρέθηκαν προτάσεις',
        empty_suggestions_description: 'Δεν υπάρχουν προτάσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!',
        top_polls_title: 'Μεγαλύτερες Ψηφοφορίες',
        top_polls_subtitle: 'Ψηφίστε στα πιο δημοφιλή θέματα',
        empty_polls_title: 'Δεν βρέθηκαν ψηφοφορίες',
        empty_polls_description: 'Δεν υπάρχουν ψηφοφορίες αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!',
        cta_title: 'Έχεις κάτι να πεις;',
        cta_description: 'Γράψε ένα άρθρο, κατέθεσε πρόταση ή ψήφισε σε ανοιχτές ψηφοφορίες!',
        cta_guest_description: 'Εγγράψου για να παρακολουθείς την περιοχή σου και να συμμετέχεις στα τοπικά νέα!',
        cta_view_locations: '🗺️ Δες Περιοχές',
        latest_news_title: 'Τελευταίες Ειδήσεις',
        latest_news_subtitle: 'Τα τελευταία νέα από εγκεκριμένες πηγές',
        empty_news_title: 'Δεν βρέθηκαν ειδήσεις',
        empty_news_description: 'Δεν υπάρχουν εγκεκριμένες ειδήσεις αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!',
        latest_videos_title: 'Τελευταία Βίντεο',
        latest_videos_subtitle: 'Βίντεο αναλύσεις και συζητήσεις',
        empty_videos_title: 'Δεν βρέθηκαν βίντεο',
        empty_videos_description: 'Δεν υπάρχουν βίντεο αυτή τη στιγμή. Ελέγξτε ξανά σύντομα!'
      },
      common: {
        register: 'Εγγραφή',
      },
      auth: {
        login_title: 'Σύνδεση στον λογαριασμό σας',
        create_new_account: 'δημιουργήστε νέο λογαριασμό',
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
      },
      articles: {
        no_articles_found: 'No Articles Found',
      },
      news: {
        no_news_available: 'No News Available',
      },
    };

    return (key) => messages[namespace]?.[key] || key;
  },
}));

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
    mockSearchParams.get.mockReset();
    mockRouter.push.mockReset();
    document.body.innerHTML = '';
  });

  test('renders home page hero and latest news section', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const HomePage = require('../app/page').default;
    const { container, root } = await renderPage(HomePage);

    expect(container.textContent).toContain('Αποφάσεις που ξεκινούν από εσένα.');
    expect(container.textContent).toContain('Τελευταίες Ειδήσεις');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders articles page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const ArticlesPage = require('../app/articles/page').default;
    const { container, root } = await renderPage(ArticlesPage);

    expect(container.textContent).toContain('All');
    expect(container.textContent).toContain('No Articles Found');

    await act(async () => {
      root.unmount();
    });
  });

  test('renders news page filters', async () => {
    useAuth.mockReturnValue(buildAuthState());
    const NewsPage = require('../app/news/page').default;
    const { container, root } = await renderPage(NewsPage);

    expect(container.textContent).toContain('All');
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
    expect(container.textContent).toContain('Επιβεβαίωση κωδικού');

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
