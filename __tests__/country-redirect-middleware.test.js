const mockNext = jest.fn();
const mockRedirect = jest.fn();
const mockFetch = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    next: (...args) => mockNext(...args),
    redirect: (...args) => mockRedirect(...args),
  }
}));

const { proxy: middleware, resetAccessRulesCacheForTests } = require('../proxy');

const makeRequest = ({
  pathname = '/',
  countryHeader = null,
  cookies = {},
  forwardedFor = null,
  realIp = null,
} = {}) => {
  const headers = new Headers();
  if (countryHeader !== null) {
    headers.set('CF-IPCountry', countryHeader);
  }
  if (forwardedFor !== null) {
    headers.set('x-forwarded-for', forwardedFor);
  }
  if (realIp !== null) {
    headers.set('x-real-ip', realIp);
  }

  return {
    nextUrl: { pathname },
    headers,
    cookies: {
      get: (name) => (cookies[name] !== undefined ? { value: cookies[name] } : undefined),
    },
    url: 'https://appofasi.gr/',
  };
};

describe('country redirect middleware', () => {
  const createNextResponse = () => ({
    type: 'next',
    cookies: { set: jest.fn() },
  });

  beforeEach(() => {
    mockNext.mockReset();
    mockRedirect.mockReset();
    mockFetch.mockClear();
    global.fetch = mockFetch;
    mockFetch.mockImplementation((url) => {
      if (String(url).endsWith('/api/geo/access-rules')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              blockedCountries: [],
              unknownCountryAction: 'allow',
              unknownCountryRedirectPath: '/unknown-country',
              noIpAction: 'allow',
              noIpRedirectPath: '/unknown-country',
            },
          }),
        });
      }
      return Promise.resolve({ ok: true });
    });
    mockNext.mockImplementation(() => createNextResponse());
    mockRedirect.mockImplementation((url) => ({
      type: 'redirect',
      url: url.toString(),
      cookies: { set: jest.fn() },
    }));
    resetAccessRulesCacheForTests();
  });

  test('skips configured paths', async () => {
    const response = await middleware(makeRequest({ pathname: '/api/geo/detect', countryHeader: 'GR' }));
    expect(response.type).toBe('next');
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          headers: expect.any(Headers),
        }),
      })
    );
    expect(mockNext.mock.calls[0][0].request.headers.get('x-detected-country')).toBe('GR');
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(response.cookies.set).toHaveBeenCalledWith('appofa_detected_country', 'GR', {
      path: '/',
      maxAge: 86400,
      sameSite: 'Lax',
    });
  });

  test('tracks admin paths while still skipping redirect', async () => {
    const response = await middleware(makeRequest({
      pathname: '/admin/geo',
      countryHeader: 'GR',
      cookies: { token: 'sample-token' },
    }));

    expect(response.type).toBe('next');
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: '/admin/geo',
          countryCode: 'GR',
          ipAddress: null,
          locale: null,
          token: 'sample-token',
        }),
      })
    );
  });

  test.each(['/login', '/country/GR'])('tracks %s while skipping redirect', async (pathname) => {
    const response = await middleware(makeRequest({ pathname, countryHeader: 'GR' }));

    expect(response.type).toBe('next');
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: pathname,
          countryCode: 'GR',
          ipAddress: null,
          locale: null,
          token: null,
        }),
      })
    );
  });

  test('skips when visited cookie exists', async () => {
    const response = await middleware(makeRequest({
      pathname: '/',
      countryHeader: 'GR',
      cookies: { appofa_country_visited: '1' }
    }));
    expect(response.type).toBe('next');
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          headers: expect.any(Headers),
        }),
      })
    );
    expect(mockNext.mock.calls[0][0].request.headers.get('x-detected-country')).toBe('GR');
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: '/',
          countryCode: 'GR',
          ipAddress: null,
          locale: null,
          token: null,
        }),
      })
    );
    expect(response.cookies.set).toHaveBeenCalledWith('appofa_detected_country', 'GR', {
      path: '/',
      maxAge: 86400,
      sameSite: 'Lax',
    });
  });

  test('redirects using Cloudflare country header and sets visited cookie', async () => {
    const response = await middleware(makeRequest({
      pathname: '/',
      countryHeader: 'gr',
      forwardedFor: '::ffff:185.230.31.201, 10.0.0.1',
      cookies: { NEXT_LOCALE: 'el' }
    }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/country/GR');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: '/',
          countryCode: 'GR',
          ipAddress: '185.230.31.201',
          locale: 'el',
          token: null,
        }),
      })
    );
    expect(response.cookies.set).toHaveBeenCalledWith('appofa_country_visited', '1', {
      path: '/',
      maxAge: 86400,
      sameSite: 'Lax',
    });
    expect(response.cookies.set).toHaveBeenCalledWith('appofa_detected_country', 'GR', {
      path: '/',
      maxAge: 86400,
      sameSite: 'Lax',
    });
  });

  test('falls back to detected country cookie when header is unavailable', async () => {
    const response = await middleware(makeRequest({
      pathname: '/',
      countryHeader: 'XX',
      cookies: { appofa_detected_country: 'cy' }
    }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/country/CY');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: '/',
          countryCode: 'CY',
          ipAddress: null,
          locale: null,
          token: null,
        }),
      })
    );
  });

  test('forwards cookie-based country via x-detected-country when header is unavailable', async () => {
    const response = await middleware(makeRequest({
      pathname: '/api/geo/detect',
      countryHeader: null,
      cookies: { appofa_detected_country: 'cy' },
    }));

    expect(response.type).toBe('next');
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          headers: expect.any(Headers),
        }),
      })
    );
    expect(mockNext.mock.calls[0][0].request.headers.get('x-detected-country')).toBe('CY');
    expect(response.cookies.set).not.toHaveBeenCalledWith(
      'appofa_detected_country',
      expect.anything(),
      expect.anything()
    );
  });

  test('does not redirect when no valid country is found', async () => {
    const response = await middleware(makeRequest({ pathname: '/', countryHeader: null, realIp: '8.8.8.8' }));
    expect(response.type).toBe('next');
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/geo-stats/track',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          path: '/',
          countryCode: null,
          ipAddress: '8.8.8.8',
          locale: null,
          token: null,
        }),
      })
    );
  });

  test('redirects blocked countries to /blocked', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            blockedCountries: ['GR'],
            unknownCountryAction: 'allow',
            unknownCountryRedirectPath: '/unknown-country',
            noIpAction: 'allow',
            noIpRedirectPath: '/unknown-country',
          },
        }),
      }));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: 'GR' }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/blocked');
  });

  test('redirects blocked countries to custom redirect path when configured', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            blockedCountries: [{ countryCode: 'RU', redirectPath: '/donate/russia' }],
            unknownCountryAction: 'allow',
            unknownCountryRedirectPath: '/unknown-country',
            noIpAction: 'allow',
            noIpRedirectPath: '/unknown-country',
          },
        }),
      }));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: 'RU' }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/donate/russia');
  });

  test('redirects unknown country to /blocked when noIpAction is block', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            blockedCountries: [],
            unknownCountryAction: 'allow',
            unknownCountryRedirectPath: '/unknown-country',
            noIpAction: 'block',
            noIpRedirectPath: '/unknown-country',
          },
        }),
      }));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: null, realIp: null }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/blocked');
  });

  test('redirects unknown country when noIpAction is redirect', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            blockedCountries: [],
            unknownCountryAction: 'allow',
            unknownCountryRedirectPath: '/unknown-country',
            noIpAction: 'redirect',
            noIpRedirectPath: '/unknown-country',
          },
        }),
      }));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: null, realIp: null }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/unknown-country');
  });

  test('falls through when unknown country and noIpAction is allow', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            blockedCountries: [],
            unknownCountryAction: 'allow',
            unknownCountryRedirectPath: '/unknown-country',
            noIpAction: 'allow',
            noIpRedirectPath: '/unknown-country',
          },
        }),
      }));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: null, realIp: null }));
    expect(response.type).toBe('next');
  });

  test('falls back to allow-all defaults when access-rules fetch fails', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.reject(new Error('network error')));

    const response = await middleware(makeRequest({ pathname: '/', countryHeader: null, realIp: null }));
    expect(response.type).toBe('next');
    expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/blocked',
    }));
  });
});
