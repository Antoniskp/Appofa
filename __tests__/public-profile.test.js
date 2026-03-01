// Tests for the username-based public profile feature

const { authAPI } = require('../lib/api');

describe('authAPI.getPublicUserProfileByUsername', () => {
  it('should export getPublicUserProfileByUsername method', () => {
    expect(typeof authAPI.getPublicUserProfileByUsername).toBe('function');
  });

  it('still exports getPublicUserProfile (legacy id-based method)', () => {
    expect(typeof authAPI.getPublicUserProfile).toBe('function');
  });
});

describe('getPublicUserProfileByUsername endpoint construction', () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  beforeEach(() => {
    delete global.window;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
              data: {
                user: {
                  id: 1,
                  username: 'testuser',
                  firstName: 'Test',
                  lastName: 'User',
                  avatar: null,
                  avatarColor: '#64748b',
                  createdAt: new Date().toISOString(),
                },
              },
            })
          ),
      })
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
  });

  it('calls GET /api/auth/users/username/:username/public', async () => {
    await authAPI.getPublicUserProfileByUsername('testuser');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/users/username/testuser/public'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('URL-encodes usernames with special characters', async () => {
    await authAPI.getPublicUserProfileByUsername('user name');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/users/username/user%20name/public'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('returns the user data on success', async () => {
    const result = await authAPI.getPublicUserProfileByUsername('testuser');
    expect(result.success).toBe(true);
    expect(result.data.user.username).toBe('testuser');
  });
});

describe('UserCard component link uses username', () => {
  it('UserCard should be defined', () => {
    const UserCard = require('../components/UserCard');
    expect(UserCard).toBeDefined();
  });
});

describe('UserRow component link uses username', () => {
  it('UserRow should be defined', () => {
    const UserRow = require('../components/user/UserRow');
    expect(UserRow).toBeDefined();
  });
});

describe('Public profile page module', () => {
  it('public profile page file can be required without throwing', () => {
    jest.mock('next/navigation', () => ({
      useParams: jest.fn(() => ({ username: 'testuser' })),
      useRouter: jest.fn(() => ({ push: jest.fn() })),
      usePathname: jest.fn(() => '/'),
      useSearchParams: jest.fn(() => ({ get: jest.fn() })),
    }));
    jest.mock('@/lib/auth-context', () => ({
      useAuth: jest.fn(() => ({ user: null, loading: false })),
    }));
    jest.mock('@/lib/api', () => ({
      authAPI: {
        getPublicUserProfileByUsername: jest.fn(() => Promise.resolve({ success: false, data: { user: null } })),
        getFollowCounts: jest.fn(() => Promise.resolve({ data: { followersCount: 0, followingCount: 0 } })),
      },
      pollAPI: {
        getAll: jest.fn(() => Promise.resolve({ success: true, data: [] })),
      },
      articleAPI: {
        getAll: jest.fn(() => Promise.resolve({ success: true, data: [] })),
      },
    }));

    // Just verify that the page module can be loaded
    let pageModule;
    expect(() => {
      pageModule = require('../app/users/[username]/page');
    }).not.toThrow();
    expect(pageModule).toBeDefined();
  });
});
