const { apiRequest } = require('../lib/api');

const jsonHeaders = { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null };

const makeResponse = (overrides = {}) => ({
  ok: true,
  status: 200,
  headers: jsonHeaders,
  text: () => Promise.resolve(JSON.stringify({ success: true })),
  ...overrides,
});

describe('apiRequest base URL selection', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
    if (originalDocument === undefined) {
      delete global.document;
    } else {
      global.document = originalDocument;
    }
  });

  test('uses server API_URL when window is undefined', async () => {
    delete global.window;
    delete global.document;
    process.env.API_URL = 'http://internal-api.test';
    process.env.NEXT_PUBLIC_API_URL = 'http://public-api.test';
    global.fetch = jest.fn(() => Promise.resolve(makeResponse()));

    await apiRequest('/api/auth/profile');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://internal-api.test/api/auth/profile',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  test('uses relative path when window is defined', async () => {
    global.window = {};
    global.document = { cookie: '' };
    process.env.API_URL = 'http://internal-api.test';
    global.fetch = jest.fn(() => Promise.resolve(makeResponse()));

    await apiRequest('/api/auth/profile');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/profile',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});

describe('apiRequest response parsing', () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const originalDocument = global.document;

  beforeEach(() => {
    delete global.window;
    delete global.document;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
    if (originalDocument === undefined) {
      delete global.document;
    } else {
      global.document = originalDocument;
    }
  });

  test('returns parsed JSON on success', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(makeResponse({ text: () => Promise.resolve(JSON.stringify({ id: 1 })) }))
    );

    const result = await apiRequest('/api/test');

    expect(result).toEqual({ id: 1 });
  });

  test('throws with server message on JSON error response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(makeResponse({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Validation error' })),
      }))
    );

    await expect(apiRequest('/api/test')).rejects.toThrow('Validation error');
  });

  test('throws with status-based message for non-JSON error body (HTML)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('<html><body>Bad Gateway</body></html>'),
      })
    );

    await expect(apiRequest('/api/test')).rejects.toThrow('Request failed (502)');
  });

  test('throws with status-based message for empty response body', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(''),
      })
    );

    await expect(apiRequest('/api/test')).rejects.toThrow('Request failed (503)');
  });

  test('throws with status-based message when JSON parse fails despite JSON content-type', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve('not valid json {{{'),
      })
    );

    await expect(apiRequest('/api/test')).rejects.toThrow('Request failed (500)');
  });
});

describe('apiRequest CSRF retry logic', () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalCustomEvent = global.CustomEvent;

  beforeEach(() => {
    delete global.window;
    delete global.document;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
    if (originalDocument === undefined) {
      delete global.document;
    } else {
      global.document = originalDocument;
    }
    if (originalCustomEvent === undefined) {
      delete global.CustomEvent;
    } else {
      global.CustomEvent = originalCustomEvent;
    }
  });

  test('retries once after CSRF 403 and succeeds', async () => {
    const csrfResponse = { ok: true, status: 200, headers: jsonHeaders, text: () => Promise.resolve(JSON.stringify({ success: true })) };
    const successResponse = { ok: true, status: 200, headers: jsonHeaders, text: () => Promise.resolve(JSON.stringify({ id: 1 })) };
    const csrfFailResponse = {
      ok: false,
      status: 403,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'Invalid CSRF token.' })),
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce(csrfFailResponse)   // first attempt: 403 CSRF error
      .mockResolvedValueOnce(csrfResponse)        // refresh CSRF call
      .mockResolvedValueOnce(successResponse);    // retry succeeds

    const result = await apiRequest('/api/articles/1', { method: 'PUT', body: '{}' });

    expect(result).toEqual({ id: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/auth/csrf'), expect.objectContaining({ credentials: 'include' }));
  });

  test('does not retry on non-CSRF 403 errors', async () => {
    const forbiddenResponse = {
      ok: false,
      status: 403,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'Forbidden.' })),
    };

    global.fetch = jest.fn().mockResolvedValue(forbiddenResponse);

    await expect(apiRequest('/api/articles/1', { method: 'DELETE' })).rejects.toThrow('Forbidden.');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('does not retry a second time if refresh also fails with CSRF error', async () => {
    const csrfFailResponse = {
      ok: false,
      status: 403,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'Invalid CSRF token.' })),
    };
    const csrfRefreshResponse = { ok: true, status: 200, headers: jsonHeaders, text: () => Promise.resolve(JSON.stringify({ success: true })) };

    global.fetch = jest.fn()
      .mockResolvedValueOnce(csrfFailResponse)   // first attempt fails
      .mockResolvedValueOnce(csrfRefreshResponse) // refresh CSRF
      .mockResolvedValueOnce(csrfFailResponse);   // retry also fails

    await expect(apiRequest('/api/articles/1', { method: 'PUT', body: '{}' })).rejects.toThrow('Invalid CSRF token.');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('dispatches session-expired event when CSRF refresh fails after auth 401', async () => {
    const authFailResponse = {
      ok: false,
      status: 401,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'No token provided. Authentication required.' })),
    };
    const csrfRefreshUnauthorizedResponse = {
      ok: false,
      status: 401,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'No token provided. Authentication required.' })),
    };
    global.window = { location: { pathname: '/profile' }, dispatchEvent: jest.fn() };
    global.CustomEvent = class CustomEvent {
      constructor(type) {
        this.type = type;
      }
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce(authFailResponse)
      .mockResolvedValueOnce(csrfRefreshUnauthorizedResponse);

    await expect(apiRequest('/api/articles/1', { method: 'PUT', body: '{}' })).rejects.toThrow('No token provided. Authentication required.');
    expect(global.window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:session-expired' }));
  });

  test('does not refresh CSRF or dispatch session-expired on GET 401 outside auth pages', async () => {
    const authFailResponse = {
      ok: false,
      status: 401,
      headers: jsonHeaders,
      text: () => Promise.resolve(JSON.stringify({ success: false, message: 'No token provided. Authentication required.' })),
    };
    global.window = {
      location: { pathname: '/polls' },
      dispatchEvent: jest.fn(),
    };
    global.CustomEvent = class CustomEvent {
      constructor(type) {
        this.type = type;
      }
    };

    global.fetch = jest.fn().mockResolvedValueOnce(authFailResponse);

    await expect(apiRequest('/api/notifications/unread-count')).rejects.toThrow('No token provided. Authentication required.');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.window.dispatchEvent).not.toHaveBeenCalled();
  });

  test.each(['/login', '/register'])(
    'does not refresh CSRF or dispatch session-expired on auth page %s',
    async (pathname) => {
      const authFailResponse = {
        ok: false,
        status: 401,
        headers: jsonHeaders,
        text: () => Promise.resolve(JSON.stringify({ success: false, message: 'No token provided. Authentication required.' })),
      };
      global.window = {
        location: { pathname },
        dispatchEvent: jest.fn(),
      };
      global.CustomEvent = class CustomEvent {
        constructor(type) {
          this.type = type;
        }
      };

      global.fetch = jest.fn().mockResolvedValueOnce(authFailResponse);

      await expect(apiRequest('/api/auth/profile')).rejects.toThrow('No token provided. Authentication required.');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.window.dispatchEvent).not.toHaveBeenCalled();
    }
  );
});
