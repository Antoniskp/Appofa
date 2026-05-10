jest.mock('../src/services/ipAccessService', () => ({
  getIpRulesCache: jest.fn(),
}));

const ipAccessService = require('../src/services/ipAccessService');
const { ipBlockMiddleware } = require('../src/middleware/rateLimiter');

describe('ipBlockMiddleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('skips in test environment without consulting IP rules', async () => {
    process.env.NODE_ENV = 'test';
    const next = jest.fn();
    const res = createRes();

    await ipBlockMiddleware({ ip: '1.2.3.4' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ipAccessService.getIpRulesCache).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('allows a whitelisted IP even when a matching blacklist entry exists', async () => {
    process.env.NODE_ENV = 'production';
    ipAccessService.getIpRulesCache.mockResolvedValue({
      whitelist: new Set(['185.92.192.81']),
      blacklist: new Set(['185.92.192.81']),
    });
    const next = jest.fn();
    const res = createRes();

    await ipBlockMiddleware({ ip: '185.92.192.81' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks a blacklisted IP that is not in the whitelist', async () => {
    process.env.NODE_ENV = 'production';
    ipAccessService.getIpRulesCache.mockResolvedValue({
      whitelist: new Set(),
      blacklist: new Set(['5.6.7.8']),
    });
    const next = jest.fn();
    const res = createRes();

    await ipBlockMiddleware({ ip: '5.6.7.8' }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes through an IP that is in neither list', async () => {
    process.env.NODE_ENV = 'production';
    ipAccessService.getIpRulesCache.mockResolvedValue({
      whitelist: new Set(['1.1.1.1']),
      blacklist: new Set(['2.2.2.2']),
    });
    const next = jest.fn();
    const res = createRes();

    await ipBlockMiddleware({ ip: '9.9.9.9' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('passes error to next when IP rules lookup throws', async () => {
    process.env.NODE_ENV = 'production';
    const dbError = new Error('DB unavailable');
    ipAccessService.getIpRulesCache.mockRejectedValue(dbError);
    const next = jest.fn();
    const res = createRes();

    await ipBlockMiddleware({ ip: '1.2.3.4' }, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
