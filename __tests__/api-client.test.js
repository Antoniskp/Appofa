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
