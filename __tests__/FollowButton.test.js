// Tests for the follow system API client methods

const { authAPI } = require('../lib/api');

describe('authAPI follow methods', () => {
  it('should export followUser method', () => {
    expect(typeof authAPI.followUser).toBe('function');
  });

  it('should export unfollowUser method', () => {
    expect(typeof authAPI.unfollowUser).toBe('function');
  });

  it('should export isFollowing method', () => {
    expect(typeof authAPI.isFollowing).toBe('function');
  });

  it('should export getFollowCounts method', () => {
    expect(typeof authAPI.getFollowCounts).toBe('function');
  });

  it('should export getFollowers method', () => {
    expect(typeof authAPI.getFollowers).toBe('function');
  });

  it('should export getFollowing method', () => {
    expect(typeof authAPI.getFollowing).toBe('function');
  });
});

describe('FollowButton component', () => {
  it('should export FollowButton component', () => {
    const FollowButton = require('../components/follow/FollowButton');
    expect(FollowButton).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const FollowButton = require('../components/follow/FollowButton');
    const type = typeof FollowButton.default || typeof FollowButton;
    expect(['function', 'object']).toContain(type);
  });
});

describe('follow API endpoint construction', () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  beforeEach(() => {
    delete global.window;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(JSON.stringify({ success: true, data: { following: true } }))
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

  it('followUser calls POST /api/users/:id/follow', async () => {
    await authAPI.followUser(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/follow'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('unfollowUser calls DELETE /api/users/:id/follow', async () => {
    await authAPI.unfollowUser(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/follow'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('isFollowing calls GET /api/users/:id/follow/status', async () => {
    await authAPI.isFollowing(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/follow/status'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getFollowCounts calls GET /api/users/:id/follow/counts', async () => {
    await authAPI.getFollowCounts(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/follow/counts'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getFollowers calls GET /api/users/:id/followers', async () => {
    await authAPI.getFollowers(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/followers'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('getFollowing calls GET /api/users/:id/following', async () => {
    await authAPI.getFollowing(42);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/42/following'),
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
