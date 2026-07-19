jest.mock('../src/services/countryAccessService', () => ({
  getCountryRulesCache: jest.fn(),
}));

const countryAccessService = require('../src/services/countryAccessService');
const countryBlockMiddleware = require('../src/middleware/countryBlockMiddleware');

describe('countryBlockMiddleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    countryAccessService.getCountryRulesCache.mockResolvedValue({
      blockedCountries: new Set(),
      blockedCountriesRedirects: new Map(),
      settings: {
        unknownCountryAction: 'allow',
        unknownCountryRedirectPath: '/unknown-country',
        noIpAction: 'block',
        noIpRedirectPath: '/unknown-country',
      },
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  test.each(['/api/auth/forgot-password', '/api/auth/reset-password'])(
    'skips country blocking for %s',
    async (path) => {
      const req = { path, headers: {}, ip: '' };
      const res = createRes();
      const next = jest.fn();

      await countryBlockMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(countryAccessService.getCountryRulesCache).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    }
  );

  test('treats request as having IP when req.ip is present even without forwarded headers', async () => {
    const req = { path: '/api/auth/login', headers: {}, ip: '203.0.113.10' };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('falls back to x-forwarded-for when req.ip is missing', async () => {
    const req = {
      path: '/api/auth/login',
      headers: { 'x-forwarded-for': '198.51.100.10, 10.0.0.4' },
      ip: '',
    };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('falls back to first non-empty x-forwarded-for array entry when req.ip is missing', async () => {
    const req = {
      path: '/api/auth/login',
      headers: { 'x-forwarded-for': ['', '198.51.100.55, 10.0.0.1'] },
      ip: '',
    };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks when no country and no usable IP under noIpAction=block', async () => {
    const req = { path: '/api/auth/login', headers: {}, ip: '' };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('redirects unknown country with IP when unknownCountryAction=redirect', async () => {
    countryAccessService.getCountryRulesCache.mockResolvedValue({
      blockedCountries: new Set(),
      blockedCountriesRedirects: new Map(),
      settings: {
        unknownCountryAction: 'redirect',
        unknownCountryRedirectPath: '/unknown-country',
        noIpAction: 'allow',
        noIpRedirectPath: '/no-ip',
      },
    });
    const req = { path: '/api/auth/login', headers: {}, ip: '203.0.113.10' };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(302, '/unknown-country');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirects no-IP requests when noIpAction=redirect', async () => {
    countryAccessService.getCountryRulesCache.mockResolvedValue({
      blockedCountries: new Set(),
      blockedCountriesRedirects: new Map(),
      settings: {
        unknownCountryAction: 'allow',
        unknownCountryRedirectPath: '/unknown-country',
        noIpAction: 'redirect',
        noIpRedirectPath: '/no-ip-country',
      },
    });
    const req = { path: '/api/auth/login', headers: {}, ip: '' };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(302, '/no-ip-country');
    expect(next).not.toHaveBeenCalled();
  });

  test('ignores unsafe redirect paths for unknown country settings', async () => {
    countryAccessService.getCountryRulesCache.mockResolvedValue({
      blockedCountries: new Set(),
      blockedCountriesRedirects: new Map(),
      settings: {
        unknownCountryAction: 'redirect',
        unknownCountryRedirectPath: 'https://example.com/phish',
        noIpAction: 'allow',
        noIpRedirectPath: '/no-ip',
      },
    });
    const req = { path: '/api/auth/login', headers: {}, ip: '203.0.113.10' };
    const res = createRes();
    const next = jest.fn();

    await countryBlockMiddleware(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
