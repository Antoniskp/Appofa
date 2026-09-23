const jwt = require('jsonwebtoken');
const optionalAuthMiddleware = require('../src/middleware/optionalAuth');
const { getCookie } = require('../src/utils/cookies');
const { User } = require('../src/models');
jest.mock('../src/models', () => ({ User: { findByPk: jest.fn() } }));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../src/utils/cookies', () => ({
  getCookie: jest.fn()
}));

describe('optionalAuthMiddleware', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  test('skips verification when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;
    getCookie.mockReturnValue('cookie-token');

    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('verifies token and sets req.user when JWT_SECRET exists', async () => {
    process.env.JWT_SECRET = 'test-secret';
    getCookie.mockReturnValue('cookie-token');
    jwt.verify.mockReturnValue({ id: 123, role: 'viewer' });
    User.findByPk.mockResolvedValue({ id: 123, role: 'viewer', sessionVersion: '0' });

    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret', { algorithms: ['HS256'] });
    expect(req.user).toMatchObject({ id: 123, role: 'viewer' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
