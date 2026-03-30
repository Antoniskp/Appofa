const request = require('supertest');
const { sequelize, User, Report } = require('../../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../../src/config/securityHeaders');

const authRoutes = require('../../src/routes/authRoutes');
const reportRoutes = require('../../src/routes/reportRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

describe('Report API', () => {
  let adminToken, adminUserId;
  let viewerToken, viewerUserId;

  const csrfToken = 'test-csrf-token-reports';

  const csrfHeaders = (userId, authToken) => {
    const { storeCsrfToken } = require('../../src/utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`, `auth_token=${authToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  const publicCsrfHeaders = () => ({});

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username, role) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!',
      });
      const user = await User.findOne({ where: { username } });
      if (role !== 'viewer') {
        await User.update({ role }, { where: { id: user.id } });
      }
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: `${username}@test.com`, password: 'Test1234!' });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: adminToken, id: adminUserId } = await registerAndLogin('report_admin', 'admin'));
    ({ token: viewerToken, id: viewerUserId } = await registerAndLogin('report_viewer', 'viewer'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── POST /api/reports ─────────────────────────────────────────────────────

  describe('POST /api/reports', () => {
    it('201 — unauthenticated user can submit a report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(publicCsrfHeaders())
        .send({
          contentType: 'article',
          contentId: 1,
          category: 'spam',
          reporterName: 'Anonymous User',
          reporterEmail: 'anon@example.com',
          message: 'This is spam.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.status).toBe('pending');
    });

    it('201 — authenticated user can submit a report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({
          contentType: 'person',
          contentId: 2,
          category: 'misinformation',
          message: 'False info.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('400 — missing required fields (unauthenticated, no name/email)', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(publicCsrfHeaders())
        .send({
          contentType: 'article',
          contentId: 1,
          category: 'spam',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('400 — invalid contentType', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(publicCsrfHeaders())
        .send({
          contentType: 'invalid_type',
          contentId: 1,
          category: 'spam',
          reporterName: 'Test',
          reporterEmail: 'test@example.com',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('409 — duplicate pending report from same email', async () => {
      // First report
      await request(app)
        .post('/api/reports')
        .set(publicCsrfHeaders())
        .send({
          contentType: 'poll',
          contentId: 5,
          category: 'harassment',
          reporterName: 'Dup User',
          reporterEmail: 'dup@example.com',
        });
      // Duplicate
      const res = await request(app)
        .post('/api/reports')
        .set(publicCsrfHeaders())
        .send({
          contentType: 'poll',
          contentId: 5,
          category: 'harassment',
          reporterName: 'Dup User',
          reporterEmail: 'dup@example.com',
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/reports ──────────────────────────────────────────────────────

  describe('GET /api/reports', () => {
    it('200 — admin can get paginated list', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set({ Cookie: `auth_token=${adminToken}` });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.reports)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('403 — non-admin (viewer) is rejected', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set({ Cookie: `auth_token=${viewerToken}` });
      expect(res.status).toBe(403);
    });

    it('401 — unauthenticated is rejected', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/reports/:id/review ──────────────────────────────────────────

  describe('POST /api/reports/:id/review', () => {
    let reportId;

    beforeAll(async () => {
      const record = await Report.create({
        contentType: 'comment',
        contentId: 10,
        category: 'inappropriate_content',
        reporterName: 'Reviewer Test',
        reporterEmail: 'rev@example.com',
        status: 'pending',
      });
      reportId = record.id;
    });

    it('200 — admin can dismiss a report', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/review`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ action: 'dismiss', adminNotes: 'Not a violation.' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.status).toBe('dismissed');
    });

    it('200 — admin can action a report', async () => {
      const record2 = await Report.create({
        contentType: 'article',
        contentId: 20,
        category: 'spam',
        reporterName: 'Action Test',
        reporterEmail: 'action@example.com',
        status: 'pending',
      });
      const res = await request(app)
        .post(`/api/reports/${record2.id}/review`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ action: 'action' });
      expect(res.status).toBe(200);
      expect(res.body.data.report.status).toBe('actioned');
    });

    it('403 — non-admin (viewer) is rejected', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/review`)
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({ action: 'dismiss' });
      expect(res.status).toBe(403);
    });
  });
});
