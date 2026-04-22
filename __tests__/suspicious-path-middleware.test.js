jest.mock('../src/services/ipAccessService', () => ({
  addRule: jest.fn(),
}));

const ipAccessService = require('../src/services/ipAccessService');
const {
  isSuspiciousPath,
  suspiciousPathMiddleware,
} = require('../src/middleware/suspiciousPathMiddleware');

describe('suspiciousPathMiddleware', () => {
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

  test('flags known suspicious path probes', () => {
    expect(isSuspiciousPath('/.env')).toBe(true);
    expect(isSuspiciousPath('/auth/.env')).toBe(true);
    expect(isSuspiciousPath('/tmp/.env.conf')).toBe(true);
    expect(isSuspiciousPath('/.git/config')).toBe(true);
    expect(isSuspiciousPath('/wp-config.php')).toBe(true);
    expect(isSuspiciousPath('/safe/path')).toBe(false);
  });

  test('skips in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const next = jest.fn();
    const res = createRes();

    await suspiciousPathMiddleware({ path: '/.env', ip: '1.2.3.4' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ipAccessService.addRule).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blacklists suspicious request IP and denies access', async () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();
    const res = createRes();

    await suspiciousPathMiddleware({ path: '/dev/.env', ip: '187.191.2.214' }, res, next);

    expect(ipAccessService.addRule).toHaveBeenCalledWith(
      '187.191.2.214',
      'blacklist',
      'Auto-blocked: scanner probe'
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('denies suspicious request even if DB write fails', async () => {
    process.env.NODE_ENV = 'development';
    ipAccessService.addRule.mockRejectedValueOnce(new Error('db failed'));
    const next = jest.fn();
    const res = createRes();

    await suspiciousPathMiddleware({ path: '/.env.old', ip: '10.10.10.10' }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes through non-suspicious requests', async () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();
    const res = createRes();

    await suspiciousPathMiddleware({ path: '/articles', ip: '10.10.10.10' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ipAccessService.addRule).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
