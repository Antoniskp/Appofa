const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { sequelize, User, WorkerToken } = require('../src/models');
const workerAuthMiddleware = require('../src/middleware/workerAuth');

describe('workerAuth middleware', () => {
  const app = express();
  app.get('/internal/test', workerAuthMiddleware, (req, res) => {
    res.json({ success: true, source: req.workerAuth?.source || null });
  });

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await User.create({
      username: 'workerauthadmin',
      email: 'workerauthadmin@test.com',
      password: 'adminpass123',
      role: 'admin',
      firstNameNative: 'Worker',
      lastNameNative: 'Auth',
    });
  });

  afterEach(() => {
    delete process.env.WORKER_TOKEN;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('accepts DB token and updates last_used_at', async () => {
    const rawToken = 'appofa_wt_db_token_1234567890abcdef';
    const hash = await bcrypt.hash(rawToken, 10);
    const createdBy = (await User.findOne({ where: { email: 'workerauthadmin@test.com' } })).id;
    const tokenRecord = await WorkerToken.create({
      name: 'DB token',
      token_hash: hash,
      created_by: createdBy,
      last_used_at: null,
      revoked_at: null,
    });

    const response = await request(app)
      .get('/internal/test')
      .set('x-worker-token', rawToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.source).toBe('database');

    const refreshed = await WorkerToken.findByPk(tokenRecord.id);
    expect(refreshed.last_used_at).toBeTruthy();
  });

  test('rejects revoked DB token', async () => {
    const rawToken = 'appofa_wt_revoked_token_1234567890abcdef';
    const hash = await bcrypt.hash(rawToken, 10);
    const createdBy = (await User.findOne({ where: { email: 'workerauthadmin@test.com' } })).id;
    await WorkerToken.create({
      name: 'Revoked token',
      token_hash: hash,
      created_by: createdBy,
      revoked_at: new Date(),
    });

    const response = await request(app)
      .get('/internal/test')
      .set('x-worker-token', rawToken);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('accepts env fallback token during transition', async () => {
    process.env.WORKER_TOKEN = 'legacy_worker_env_token_1234567890';

    const response = await request(app)
      .get('/internal/test')
      .set('x-worker-token', 'legacy_worker_env_token_1234567890');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.source).toBe('env');
  });

  test('rejects invalid token format before comparison', async () => {
    process.env.WORKER_TOKEN = 'legacy_worker_env_token_1234567890';

    const response = await request(app)
      .get('/internal/test')
      .set('x-worker-token', 'bad token with spaces');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid worker token format.');
  });
});
