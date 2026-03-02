const request = require('supertest');
const { sequelize, User } = require('../src/models');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Delete Account endpoint', () => {
  let authToken;
  let userId;
  const csrfToken = 'csrf-delete-account-test';

  const csrfHeaders = {
    Cookie: [`csrf_token=${csrfToken}`],
    'x-csrf-token': csrfToken,
  };

  const setCsrf = (uid) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(csrfToken, uid);
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    await User.create({
      username: 'deleteme',
      email: 'deleteme@test.com',
      password: 'delete123',
      role: 'viewer',
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deleteme@test.com', password: 'delete123' });

    const cookie = loginResponse.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    authToken = cookie?.split(';')[0].replace('auth_token=', '');
    const user = await User.findOne({ where: { email: 'deleteme@test.com' } });
    userId = user?.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should return 401 when unauthenticated', async () => {
    const response = await request(app)
      .delete('/api/auth/profile')
      .send({ password: 'delete123', mode: 'anonymize' });
    expect(response.status).toBe(401);
  });

  test('should return 403 when CSRF token is missing', async () => {
    setCsrf(userId);
    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${authToken}`])
      .send({ password: 'delete123', mode: 'anonymize' });
    expect(response.status).toBe(403);
  });

  test('should return 400 for invalid mode', async () => {
    setCsrf(userId);
    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ password: 'delete123', mode: 'invalid' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/mode/i);
  });

  test('should return 400 for wrong password', async () => {
    setCsrf(userId);
    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ password: 'wrongpassword', mode: 'anonymize' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/incorrect/i);
  });

  test('should anonymize account successfully', async () => {
    // Re-create a fresh user for this test
    const fresh = await User.create({
      username: 'anon-target',
      email: 'anon@test.com',
      password: 'anon1234',
      role: 'viewer',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'anon@test.com', password: 'anon1234' });
    const cookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    const token = cookie?.split(';')[0].replace('auth_token=', '');

    const anonCsrf = 'csrf-anon-test';
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(anonCsrf, fresh.id);

    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${token}`, `csrf_token=${anonCsrf}`])
      .set('x-csrf-token', anonCsrf)
      .send({ password: 'anon1234', mode: 'anonymize' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const scrubbed = await User.findByPk(fresh.id);
    expect(scrubbed).not.toBeNull();
    expect(scrubbed.email).toBe(`deleted-user-${fresh.id}@deleted.invalid`);
    expect(scrubbed.password).toBeNull();
    expect(scrubbed.searchable).toBe(false);
  });

  test('should purge account successfully', async () => {
    const purgeUser = await User.create({
      username: 'purge-target',
      email: 'purge@test.com',
      password: 'purge1234',
      role: 'viewer',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'purge@test.com', password: 'purge1234' });
    const cookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    const token = cookie?.split(';')[0].replace('auth_token=', '');

    const purgeCsrf = 'csrf-purge-test';
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(purgeCsrf, purgeUser.id);

    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${token}`, `csrf_token=${purgeCsrf}`])
      .set('x-csrf-token', purgeCsrf)
      .send({ password: 'purge1234', mode: 'purge' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deleted = await User.findByPk(purgeUser.id);
    expect(deleted).toBeNull();
  });

  test('should return 400 when user has no password set', async () => {
    const oauthUser = await User.create({
      username: 'oauth-only',
      email: 'oauth@test.com',
      password: null,
      githubId: 'gh-123',
      role: 'viewer',
    });

    // Manually sign a JWT for the oauth user (bypass normal login)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: oauthUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const oauthCsrf = 'csrf-oauth-test';
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(oauthCsrf, oauthUser.id);

    const response = await request(app)
      .delete('/api/auth/profile')
      .set('Cookie', [`auth_token=${token}`, `csrf_token=${oauthCsrf}`])
      .set('x-csrf-token', oauthCsrf)
      .send({ password: 'anything', mode: 'purge' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/password/i);
  });

  test('getProfile response includes hasPassword field', async () => {
    setCsrf(userId);
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Cookie', [`auth_token=${authToken}`]);
    expect(response.status).toBe(200);
    expect(response.body.data.user).toHaveProperty('hasPassword');
    expect(typeof response.body.data.user.hasPassword).toBe('boolean');
  });
});
