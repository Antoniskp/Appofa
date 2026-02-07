const { apiRequest } = require('../lib/api');

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
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

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
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    await apiRequest('/api/auth/profile');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/profile',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
