const mockNext = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    next: (...args) => mockNext(...args),
    redirect: (...args) => mockRedirect(...args),
  }
}));

const { proxy: middleware } = require('../proxy');

const makeRequest = ({ pathname = '/', countryHeader = null, cookies = {} } = {}) => {
  const headers = new Headers();
  if (countryHeader !== null) {
    headers.set('CF-IPCountry', countryHeader);
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
  const createNextResponse = () => ({ type: 'next' });

  beforeEach(() => {
    mockNext.mockReset();
    mockRedirect.mockReset();
    mockNext.mockImplementation(() => createNextResponse());
    mockRedirect.mockImplementation((url) => ({
      type: 'redirect',
      url: url.toString(),
      cookies: { set: jest.fn() },
    }));
  });

  test('skips configured paths', () => {
    const response = middleware(makeRequest({ pathname: '/api/geo/detect', countryHeader: 'GR' }));
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
  });

  test('skips when visited cookie exists', () => {
    const response = middleware(makeRequest({
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
  });

  test('redirects using Cloudflare country header and sets visited cookie', () => {
    const response = middleware(makeRequest({ pathname: '/', countryHeader: 'gr' }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/country/GR');
    expect(response.cookies.set).toHaveBeenCalledWith('appofa_country_visited', '1', {
      path: '/',
      maxAge: 86400,
      sameSite: 'Lax',
    });
  });

  test('falls back to detected country cookie when header is unavailable', () => {
    const response = middleware(makeRequest({
      pathname: '/',
      countryHeader: 'XX',
      cookies: { appofa_detected_country: 'cy' }
    }));
    expect(response.type).toBe('redirect');
    expect(response.url).toBe('https://appofasi.gr/country/CY');
  });

  test('does not redirect when no valid country is found', () => {
    const response = middleware(makeRequest({ pathname: '/', countryHeader: null }));
    expect(response.type).toBe('next');
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
