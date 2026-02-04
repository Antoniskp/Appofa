/**
 * Tests for API proxy error handling
 * Ensures 502 errors return valid JSON instead of HTML
 */

describe('API Proxy Error Handling', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console errors during tests
    console.error = jest.fn();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  test('returns JSON 502 when backend is unavailable', async () => {
    // Simulate connection refused error
    global.fetch = jest.fn(() => {
      const error = new Error('fetch failed');
      error.cause = { code: 'ECONNREFUSED' };
      return Promise.reject(error);
    });

    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'GET',
      nextUrl: {
        pathname: '/api/articles',
        search: '?status=published&limit=6&page=1'
      },
      headers: new Headers()
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data).toEqual({
      success: false,
      message: 'Backend service is unavailable. Please try again later.'
    });
  });

  test('returns JSON 504 on timeout', async () => {
    // Simulate timeout
    global.fetch = jest.fn(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'GET',
      nextUrl: {
        pathname: '/api/auth/profile',
        search: ''
      },
      headers: new Headers()
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data).toEqual({
      success: false,
      message: 'Backend request timeout. Please try again later.'
    });
  });

  test('returns JSON 502 for generic fetch errors', async () => {
    // Simulate generic fetch error
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'GET',
      nextUrl: {
        pathname: '/api/articles',
        search: ''
      },
      headers: new Headers()
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data).toEqual({
      success: false,
      message: 'An error occurred while processing your request.'
    });
  });

  test('returns JSON 405 for disallowed methods', async () => {
    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'TRACE',
      nextUrl: {
        pathname: '/api/articles',
        search: ''
      },
      headers: new Headers()
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(data).toEqual({
      success: false,
      message: 'Method Not Allowed'
    });
  });

  test('proxies successful requests correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ success: true, data: { articles: [] } }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
    );

    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'GET',
      nextUrl: {
        pathname: '/api/articles',
        search: '?status=published'
      },
      headers: new Headers()
    };

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/articles?status=published'),
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual'
      })
    );
  });

  test('logs errors for debugging', async () => {
    const testError = new Error('Connection failed');
    global.fetch = jest.fn(() => Promise.reject(testError));

    const { GET } = require('../app/api/[...path]/route.js');
    
    const mockRequest = {
      method: 'GET',
      nextUrl: {
        pathname: '/api/articles',
        search: ''
      },
      headers: new Headers()
    };

    await GET(mockRequest);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[Proxy Error]'),
      expect.any(String)
    );
  });
});
