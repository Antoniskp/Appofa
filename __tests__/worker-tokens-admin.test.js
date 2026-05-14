const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { sequelize, User, WorkerToken } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const loginApp = express();
loginApp.use(express.json());
loginApp.use('/api/auth', authRoutes);

describe('Admin Worker Token routes', () => {
  let adminToken;
  let viewerToken;
  let adminUserId;
  let viewerUserId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await User.create({
      username: 'workertokenadmin',
      email: 'workertokenadmin@test.com',
      password: 'adminpass123',
      role: 'admin',
      firstNameNative: 'Worker',
      lastNameNative: 'Admin',
    });
    await User.create({
      username: 'workertokenviewer',
      email: 'workertokenviewer@test.com',
      password: 'viewerpass123',
      role: 'viewer',
      firstNameNative: 'Worker',
      lastNameNative: 'Viewer',
    });

    const adminLogin = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'workertokenadmin@test.com', password: 'adminpass123' });
    const viewerLogin = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'workertokenviewer@test.com', password: 'viewerpass123' });

    const adminCookie = adminLogin.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    const viewerCookie = viewerLogin.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    adminToken = adminCookie?.split(';')[0].replace('auth_token=', '');
    viewerToken = viewerCookie?.split(';')[0].replace('auth_token=', '');

    adminUserId = (await User.findOne({ where: { email: 'workertokenadmin@test.com' } }))?.id;
    viewerUserId = (await User.findOne({ where: { email: 'workertokenviewer@test.com' } }))?.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('POST /api/admin/worker-tokens creates token and returns plaintext token once', async () => {
    const csrfToken = 'csrf-worker-token-create';
    storeCsrfToken(csrfToken, adminUserId);

    const response = await request(app)
      .post('/api/admin/worker-tokens')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Primary worker token' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.name).toBe('Primary worker token');
    expect(response.body.data.created_by).toBe(adminUserId);
    expect(response.body.data).not.toHaveProperty('token_hash');

    const storedToken = await WorkerToken.findByPk(response.body.data.id);
    expect(storedToken).toBeTruthy();
    expect(storedToken.token_hash).not.toBe(response.body.data.token);
    await expect(bcrypt.compare(response.body.data.token, storedToken.token_hash)).resolves.toBe(true);
  });

  test('GET /api/admin/worker-tokens lists metadata only', async () => {
    const response = await request(app)
      .get('/api/admin/worker-tokens')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((token) => {
      expect(token).toHaveProperty('id');
      expect(token).toHaveProperty('name');
      expect(token).toHaveProperty('created_at');
      expect(token).toHaveProperty('last_used_at');
      expect(token).toHaveProperty('revoked_at');
      expect(token).toHaveProperty('created_by');
      expect(token).not.toHaveProperty('token');
      expect(token).not.toHaveProperty('token_hash');
    });
  });

  test('POST /api/admin/worker-tokens/:id/revoke sets revoked_at', async () => {
    const createCsrf = 'csrf-worker-token-create-2';
    storeCsrfToken(createCsrf, adminUserId);

    const createResponse = await request(app)
      .post('/api/admin/worker-tokens')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${createCsrf}`])
      .set('x-csrf-token', createCsrf)
      .send({ name: 'Revokable token' });
    const tokenId = createResponse.body.data.id;

    const revokeCsrf = 'csrf-worker-token-revoke';
    storeCsrfToken(revokeCsrf, adminUserId);
    const response = await request(app)
      .post(`/api/admin/worker-tokens/${tokenId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${revokeCsrf}`])
      .set('x-csrf-token', revokeCsrf);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(tokenId);
    expect(response.body.data.revoked_at).toBeTruthy();

    const token = await WorkerToken.findByPk(tokenId);
    expect(token.revoked_at).toBeTruthy();
  });

  test('viewer cannot create/list/revoke worker tokens', async () => {
    const listResponse = await request(app)
      .get('/api/admin/worker-tokens')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(listResponse.status).toBe(403);

    const createCsrf = 'csrf-worker-token-create-viewer';
    storeCsrfToken(createCsrf, viewerUserId);
    const createResponse = await request(app)
      .post('/api/admin/worker-tokens')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('Cookie', [`csrf_token=${createCsrf}`])
      .set('x-csrf-token', createCsrf)
      .send({ name: 'Should fail' });
    expect(createResponse.status).toBe(403);

    const revokeCsrf = 'csrf-worker-token-revoke-viewer';
    storeCsrfToken(revokeCsrf, viewerUserId);
    const revokeResponse = await request(app)
      .post('/api/admin/worker-tokens/1/revoke')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('Cookie', [`csrf_token=${revokeCsrf}`])
      .set('x-csrf-token', revokeCsrf);
    expect(revokeResponse.status).toBe(403);
  });
});
