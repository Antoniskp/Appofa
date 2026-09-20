const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

jest.mock('../src/services/workerClientService', () => ({
  checkHealth: jest.fn(),
  createSnapshot: jest.fn()
}));

jest.mock('../src/websocket/workerWsServer', () => ({
  getConnectedWorkers: jest.fn(),
  sendRequest: jest.fn(),
  sendTaskToWorker: jest.fn(),
  getFirstConnectedWorkerId: jest.fn(),
}));

const workerClientService = require('../src/services/workerClientService');
const {
  getConnectedWorkers,
  sendRequest,
  sendTaskToWorker,
  getFirstConnectedWorkerId,
} = require('../src/websocket/workerWsServer');
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
    getFirstConnectedWorkerId.mockReturnValue('worker-1');
    sendRequest.mockResolvedValue({
      type: 'health_response',
      status: 200,
      data: { ok: true }
    });

    const response = await request(app)
      .get('/api/admin/worker-status/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(200);
    expect(sendRequest).toHaveBeenCalledWith('worker-1', { type: 'health_request' });
  });

  test('POST /api/admin/worker-status/test-snapshot sends snapshot for admin', async () => {
    getFirstConnectedWorkerId.mockReturnValue('worker-1');
    sendRequest.mockResolvedValue({
      type: 'snapshot_response',
      status: 202,
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
    expect(sendRequest).toHaveBeenCalledWith('worker-1', {
      type: 'snapshot_request',
      snapshot: { source: 'test-suite' }
    });
  });

  test('worker status routes return 503 when no worker is connected', async () => {
    getFirstConnectedWorkerId.mockReturnValue(null);

    const healthResponse = await request(app)
      .get('/api/admin/worker-status/health')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(healthResponse.status).toBe(503);
    expect(healthResponse.body.message).toBe('No worker connected.');

    const csrfToken = 'csrf-worker-snapshot-no-worker';
    storeCsrfToken(csrfToken, adminUserId);

    const snapshotResponse = await request(app)
      .post('/api/admin/worker-status/test-snapshot')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ snapshot: { source: 'no-worker' } });
    expect(snapshotResponse.status).toBe(503);
    expect(snapshotResponse.body.message).toBe('No worker connected.');
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

  test('GET /api/admin/legal/worker returns legal worker capability status', async () => {
    getConnectedWorkers.mockReturnValue([
      {
        workerId: 'worker-legal',
        capabilities: ['linkPreview', 'importParliamentLaws', 'normalizeGreekLaw', 'greekLegalCitations'],
      },
      {
        workerId: 'worker-basic',
        capabilities: ['linkPreview'],
      },
    ]);

    const response = await request(app)
      .get('/api/admin/legal/worker')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.connected).toBe(true);
    expect(response.body.data.workers).toHaveLength(2);
    expect(response.body.data.legalWorkers).toHaveLength(1);
    expect(response.body.data.legalWorkers[0].workerId).toBe('worker-legal');
  });

  test('POST /api/admin/legal/import-parliament-laws sends import task to legal worker', async () => {
    getFirstConnectedWorkerId.mockReturnValue('worker-legal');
    sendTaskToWorker.mockResolvedValue({
      taskId: 'task-legal-import',
      status: 'success',
      result: {
        page: { page_no: 1, page_size: 2, total_records: 10 },
        documents: [],
        stats: { document_count: 0, reference_count: 0 },
      },
    });
    const csrfToken = 'csrf-legal-import-admin';
    storeCsrfToken(csrfToken, adminUserId);

    const response = await request(app)
      .post('/api/admin/legal/import-parliament-laws')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken)
      .send({ pageNo: 1, pageSize: 200, title: 'στεγαστική', lawNum: 5329 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workerId).toBe('worker-legal');
    expect(response.body.data.taskId).toBe('task-legal-import');
    expect(getFirstConnectedWorkerId).toHaveBeenCalledWith('importParliamentLaws');
    expect(sendTaskToWorker).toHaveBeenCalledWith('worker-legal', 'importParliamentLaws', {
      pageNo: 1,
      pageSize: 50,
      lawNum: '5329',
      title: 'στεγαστική',
    }, 45000);
  });
});
