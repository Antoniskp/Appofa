const jwt = require('jsonwebtoken');
const { sequelize, User } = require('../src/models');
const { generateToken, changePassword, resetPasswordWithToken } = require('../src/services/authService');
const { resolveSession } = require('../src/services/sessionService');
const auth = require('../src/middleware/auth');
const optionalAuth = require('../src/middleware/optionalAuth');
const authController = require('../src/controllers/authController');
const { createHash } = require('crypto');

const requestFor = (token) => ({ headers: { authorization: `Bearer ${token}` } });
const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), clearCookie: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('session revocation with persisted accounts', () => {
  let user, token;
  beforeAll(async () => { await sequelize.sync({ force: true }); });
  afterAll(async () => { await sequelize.close(); });
  beforeEach(async () => {
    user = await User.create({ username: `user${Date.now()}`, email: `${Date.now()}@test.com`, password: 'old-password-123', role: 'admin' });
    token = generateToken(user);
  });

  test('demotion immediately overrides admin claims in required and optional auth', async () => {
    await user.update({ role: 'viewer', isVerified: false });
    for (const middleware of [auth, optionalAuth]) {
      const req = requestFor(token), next = jest.fn();
      await middleware(req, response(), next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.role).toBe('viewer');
    }
  });

  test('deleted accounts cannot authenticate', async () => {
    await user.destroy();
    const res = response(), next = jest.fn();
    await auth(requestFor(token), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('password change revokes old and legacy tokens, fresh login remains valid', async () => {
    const legacy = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET);
    await changePassword(user.id, 'old-password-123', 'new-password-456');
    expect(await resolveSession(requestFor(token))).toBeNull();
    expect(await resolveSession(requestFor(legacy))).toBeNull();
    await user.reload();
    expect(await resolveSession(requestFor(generateToken(user)))).toMatchObject({ id: user.id });
  });

  test('password reset revokes existing sessions', async () => {
    const resetToken = 'random-reset-token';
    await user.update({ resetPasswordTokenHash: createHash('sha256').update(resetToken).digest('hex'), resetPasswordExpires: new Date(Date.now() + 60000) });
    await resetPasswordWithToken(resetToken, 'reset-password-456');
    expect(await resolveSession(requestFor(token))).toBeNull();
  });

  test('logout revokes bearer copies as well as browser cookies', async () => {
    const res = response();
    await authController.logout({ user: { id: user.id } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(await resolveSession(requestFor(token))).toBeNull();
    const req = requestFor(token);
    req.user = { id: user.id, role: 'admin' };
    await optionalAuth(req, response(), jest.fn());
    expect(req.user).toBeUndefined();
  });

  test('a database outage fails closed instead of trusting JWT claims', async () => {
    const spy = jest.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('offline'));
    const res = response(), next = jest.fn();
    await auth(requestFor(token), res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
