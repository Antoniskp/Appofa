const jwt = require('jsonwebtoken');
const optionalAuthMiddleware = require('../src/middleware/optionalAuth');

describe('optionalAuthMiddleware', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('does not authenticate tokens when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign({ id: 123 }, 'your-secret-key-change-this-in-production')}`
      }
    };

    const res = {};
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('authenticates valid tokens when JWT_SECRET is configured', async () => {
    process.env.JWT_SECRET = 'test-optional-auth-secret';

    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign({ id: 456 }, process.env.JWT_SECRET)}`
      }
    };

    const res = {};
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(456);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
