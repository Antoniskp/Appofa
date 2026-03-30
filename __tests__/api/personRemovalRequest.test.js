const request = require('supertest');
const { sequelize, User, PublicPersonProfile, PersonRemovalRequest } = require('../../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../../src/config/securityHeaders');

const authRoutes = require('../../src/routes/authRoutes');
const personRemovalRequestRoutes = require('../../src/routes/personRemovalRequestRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/person-removal-requests', personRemovalRequestRoutes);

describe('Person Removal Request API', () => {
  let adminToken, adminUserId;
  let viewerToken, viewerUserId;
  let testPersonId;

  const csrfToken = 'test-csrf-token-removal';

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

    ({ token: adminToken, id: adminUserId } = await registerAndLogin('remov_admin', 'admin'));
    ({ token: viewerToken, id: viewerUserId } = await registerAndLogin('remov_viewer', 'viewer'));

    // Create a test public person profile
    const person = await PublicPersonProfile.create({
      firstName: 'Test',
      lastName: 'Person',
      slug: 'test-person-removal',
    });
    testPersonId = person.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── POST /api/person-removal-requests ────────────────────────────────────

  describe('POST /api/person-removal-requests', () => {
    it('201 — creates a removal request successfully', async () => {
      const res = await request(app)
        .post('/api/person-removal-requests')
        .set(publicCsrfHeaders())
        .send({
          publicPersonProfileId: testPersonId,
          requesterName: 'Jane Doe',
          requesterEmail: 'jane@example.com',
          message: 'I want to be removed from the platform.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request).toBeDefined();
      expect(res.body.data.request.status).toBe('pending');
    });

    it('400 — missing required fields', async () => {
      const res = await request(app)
        .post('/api/person-removal-requests')
        .set(publicCsrfHeaders())
        .send({ publicPersonProfileId: testPersonId, requesterName: 'Jane Doe' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('400 — invalid email format', async () => {
      const res = await request(app)
        .post('/api/person-removal-requests')
        .set(publicCsrfHeaders())
        .send({
          publicPersonProfileId: testPersonId,
          requesterName: 'Jane Doe',
          requesterEmail: 'not-an-email',
          message: 'Remove me.',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('404 — non-existent publicPersonProfileId', async () => {
      const res = await request(app)
        .post('/api/person-removal-requests')
        .set(publicCsrfHeaders())
        .send({
          publicPersonProfileId: 99999,
          requesterName: 'Jane Doe',
          requesterEmail: 'jane@example.com',
          message: 'Remove me.',
        });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/person-removal-requests ─────────────────────────────────────

  describe('GET /api/person-removal-requests', () => {
    it('200 — admin can get paginated list', async () => {
      const res = await request(app)
        .get('/api/person-removal-requests')
        .set({ Cookie: `auth_token=${adminToken}` });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.requests)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('403 — non-admin (viewer) is rejected', async () => {
      const res = await request(app)
        .get('/api/person-removal-requests')
        .set({ Cookie: `auth_token=${viewerToken}` });
      expect(res.status).toBe(403);
    });

    it('401 — unauthenticated is rejected', async () => {
      const res = await request(app).get('/api/person-removal-requests');
      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/person-removal-requests/:id/review ──────────────────────────

  describe('POST /api/person-removal-requests/:id/review', () => {
    let requestId;

    beforeAll(async () => {
      const record = await PersonRemovalRequest.create({
        publicPersonProfileId: testPersonId,
        requesterName: 'Review Test',
        requesterEmail: 'review@example.com',
        message: 'Please remove.',
        status: 'pending',
      });
      requestId = record.id;
    });

    it('200 — admin can approve a request', async () => {
      const res = await request(app)
        .post(`/api/person-removal-requests/${requestId}/review`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ action: 'approve', adminNotes: 'Approved.' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('approved');
    });

    it('200 — admin can reject a request', async () => {
      // Create another pending request to reject
      const record2 = await PersonRemovalRequest.create({
        publicPersonProfileId: testPersonId,
        requesterName: 'Reject Test',
        requesterEmail: 'reject@example.com',
        message: 'Remove please.',
        status: 'pending',
      });
      const res = await request(app)
        .post(`/api/person-removal-requests/${record2.id}/review`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ action: 'reject' });
      expect(res.status).toBe(200);
      expect(res.body.data.request.status).toBe('rejected');
    });

    it('400 — invalid action', async () => {
      const res = await request(app)
        .post(`/api/person-removal-requests/${requestId}/review`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ action: 'delete' });
      expect(res.status).toBe(400);
    });

    it('403 — non-admin (viewer) is rejected', async () => {
      const res = await request(app)
        .post(`/api/person-removal-requests/${requestId}/review`)
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({ action: 'approve' });
      expect(res.status).toBe(403);
    });
  });
});
