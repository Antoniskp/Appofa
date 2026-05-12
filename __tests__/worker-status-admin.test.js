const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

jest.mock('../src/services/workerClientService', () => ({
  checkHealth: jest.fn(),
  createSnapshot: jest.fn()
}));

const workerClientService = require('../src/services/workerClientService');
const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const loginApp = express();
loginApp.use(express.json());
loginApp.use('/api/auth', authRoutes);

describe('Admin Worker Status routes', () => {
  let adminToken;
  let viewerToken;
  let adminUserId;
  let viewerUserId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await User.create({
      username: 'workeradmin',
      email: 'workeradmin@test.com',
      password: 'adminpass123',
      role: 'admin',
      firstNameNative: 'Worker',
      lastNameNative: 'Admin',
    });
    await User.create({
      username: 'workerviewer',
      email: 'workerviewer@test.com',
      password: 'viewerpass123',
      role: 'viewer',
      firstNameNative: 'Worker',
      lastNameNative: 'Viewer',
    });

    const adminLogin = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'workeradmin@test.com', password: 'adminpass123' });
    const viewerLogin = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'workerviewer@test.com', password: 'viewerpass123' });

    const adminCookie = adminLogin.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    const viewerCookie = viewerLogin.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    adminToken = adminCookie?.split(';')[0].replace('auth_token=', '');
    viewerToken = viewerCookie?.split(';')[0].replace('auth_token=', '');

    adminUserId = (await User.findOne({ where: { email: 'workeradmin@test.com' } }))?.id;
    viewerUserId = (await User.findOne({ where: { email: 'workerviewer@test.com' } }))?.id;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('GET /api/admin/worker-status/health returns worker status for admin', async () => {
    workerClientService.checkHealth.mockResolvedValue({
      status: 200,
      latencyMs: 15,
      data: { ok: true }
    });

    const response = await request(app)
      .get('/api/admin/worker-status/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(200);
    expect(workerClientService.checkHealth).toHaveBeenCalledTimes(1);
  });

  test('POST /api/admin/worker-status/test-snapshot sends snapshot for admin', async () => {
    workerClientService.createSnapshot.mockResolvedValue({
      status: 202,
      latencyMs: 22,
      data: { accepted: true }
    });
    const csrfToken = 'csrf-worker-snapshot-admin';
    storeCsrfToken(csrfToken, adminUserId);

    const response = await request(app)
      .post('/api/admin/worker-status/test-snapshot')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ snapshot: { source: 'test-suite' } });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(workerClientService.createSnapshot).toHaveBeenCalledWith({ source: 'test-suite' });
  });

  test('viewer cannot access worker status routes', async () => {
    const csrfToken = 'csrf-worker-snapshot-viewer';
    storeCsrfToken(csrfToken, viewerUserId);

    const healthResponse = await request(app)
      .get('/api/admin/worker-status/health')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(healthResponse.status).toBe(403);

    const snapshotResponse = await request(app)
      .post('/api/admin/worker-status/test-snapshot')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ snapshot: { source: 'viewer-test' } });
    expect(snapshotResponse.status).toBe(403);
  });
});
