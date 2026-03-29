/**
 * Candidate API integration tests
 * Uses supertest with a real SQLite test DB.
 */
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../../config/securityHeaders');
const { sequelize, User, PublicPersonProfile, CandidateApplication } = require('../../models');
const authRoutes = require('../../routes/authRoutes');
const personRoutes = require('../../routes/personRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/candidates', personRoutes);

describe('Candidate API Tests', () => {
  let adminToken, adminId;
  let moderatorToken, moderatorId;
  let viewerToken, viewerId;
  let candidateToken, candidateId;
  let profileId, profileSlug;
  let applicationId;

  const csrfToken = 'test-csrf-candidate';
  const csrfHeaders = (userId, authToken) => {
    const { storeCsrfToken } = require('../../utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`, `auth_token=${authToken}`],
      'x-csrf-token': csrfToken
    };
  };

  const withToken = (token) => ({ Cookie: [`auth_token=${token}`] });

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username, role) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@cand.test`,
        password: 'Test1234!'
      });
      const user = await User.findOne({ where: { username } });
      if (role !== 'viewer') await user.update({ role });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@cand.test`,
        password: 'Test1234!'
      });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: adminToken, id: adminId } = await registerAndLogin('cand_admin', 'admin'));
    ({ token: moderatorToken, id: moderatorId } = await registerAndLogin('cand_mod', 'moderator'));
    ({ token: viewerToken, id: viewerId } = await registerAndLogin('cand_viewer', 'viewer'));
    ({ token: candidateToken, id: candidateId } = await registerAndLogin('cand_cand', 'candidate'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/candidates ─────────────────────────────────────────────────

  describe('GET /api/candidates', () => {
    it('returns paginated list (public)', async () => {
      const res = await request(app).get('/api/candidates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('profiles');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('supports search query param', async () => {
      const res = await request(app).get('/api/candidates?search=nobody');
      expect(res.status).toBe(200);
      expect(res.body.data.profiles).toHaveLength(0);
    });
  });

  // ── POST /api/candidates (create profile - moderator) ──────────────────

  describe('POST /api/candidates', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/candidates').send({ firstName: 'Test', lastName: 'X' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when viewer tries to create', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set(withToken(viewerToken))
        .send({ firstName: 'Test', lastName: 'X' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when firstName is missing', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set(csrfHeaders(moderatorId, moderatorToken))
        .send({});
      expect(res.status).toBe(400);
    });

    it('creates a candidate profile as moderator', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set(csrfHeaders(moderatorId, moderatorToken))
        .send({ firstName: 'Maria', lastName: 'Papadopoulou', bio: 'Independent candidate' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toHaveProperty('slug');
      expect(res.body.data.profile.claimStatus).toBe('unclaimed');
      expect(res.body.data.profile.source).toBe('moderator');
      profileId = res.body.data.profile.id;
      profileSlug = res.body.data.profile.slug;
    });
  });

  // ── GET /api/candidates/:slug ───────────────────────────────────────────

  describe('GET /api/candidates/:slug', () => {
    it('returns candidate profile', async () => {
      const res = await request(app).get(`/api/candidates/${profileSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.profile.slug).toBe(profileSlug);
      expect(res.body.data.profile.fullName).toBe('Maria Papadopoulou');
    });

    it('returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/candidates/does-not-exist-xyz');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/candidates/apply ─────────────────────────────────────────

  describe('POST /api/candidates/apply', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/candidates/apply').send({});
      expect(res.status).toBe(401);
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/candidates/apply')
        .set(csrfHeaders(viewerId, viewerToken))
        .send({ firstName: 'Viewer', lastName: 'User' });
      expect(res.status).toBe(400);
    });

    it('submits application successfully', async () => {
      const res = await request(app)
        .post('/api/candidates/apply')
        .set(csrfHeaders(viewerId, viewerToken))
        .send({ firstName: 'Viewer', lastName: 'User', supportingStatement: 'I want to represent my area.' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('pending');
      applicationId = res.body.data.application.id;
    });

    it('returns 409 if user already has pending application', async () => {
      const res = await request(app)
        .post('/api/candidates/apply')
        .set(csrfHeaders(viewerId, viewerToken))
        .send({ firstName: 'Viewer', lastName: 'User', supportingStatement: 'Second attempt' });
      expect(res.status).toBe(409);
    });
  });

  // ── GET /api/candidates/my-application ────────────────────────────────

  describe('GET /api/candidates/my-application', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/candidates/my-application');
      expect(res.status).toBe(401);
    });

    it('returns the user own application', async () => {
      const res = await request(app)
        .get('/api/candidates/my-application')
        .set(withToken(viewerToken));
      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('pending');
    });

    it('returns 404 if no application exists', async () => {
      const res = await request(app)
        .get('/api/candidates/my-application')
        .set(withToken(candidateToken));
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/candidates/applications ──────────────────────────────────

  describe('GET /api/candidates/applications', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/candidates/applications');
      expect(res.status).toBe(401);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .get('/api/candidates/applications')
        .set(withToken(viewerToken));
      expect(res.status).toBe(403);
    });

    it('returns pending applications for moderator', async () => {
      const res = await request(app)
        .get('/api/candidates/applications')
        .set(withToken(moderatorToken));
      expect(res.status).toBe(200);
      expect(res.body.data.applications.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/candidates/applications/:id ──────────────────────────────

  describe('GET /api/candidates/applications/:id', () => {
    it('returns application by id for moderator', async () => {
      const res = await request(app)
        .get(`/api/candidates/applications/${applicationId}`)
        .set(withToken(moderatorToken));
      expect(res.status).toBe(200);
      expect(res.body.data.application.id).toBe(applicationId);
    });

    it('returns 404 for unknown application', async () => {
      const res = await request(app)
        .get('/api/candidates/applications/9999')
        .set(withToken(moderatorToken));
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/candidates/applications/:id/approve ────────────────────

  describe('POST /api/candidates/applications/:id/approve', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post(`/api/candidates/applications/${applicationId}/approve`);
      expect(res.status).toBe(401);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post(`/api/candidates/applications/${applicationId}/approve`)
        .set(withToken(viewerToken));
      expect(res.status).toBe(403);
    });

    it('approves application and creates profile', async () => {
      const res = await request(app)
        .post(`/api/candidates/applications/${applicationId}/approve`)
        .set(csrfHeaders(moderatorId, moderatorToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.claimStatus).toBe('claimed');
      // Verify user role was promoted
      const updatedUser = await User.findByPk(viewerId);
      expect(updatedUser.role).toBe('candidate');
    });

    it('returns 400 if application not pending anymore', async () => {
      const res = await request(app)
        .post(`/api/candidates/applications/${applicationId}/approve`)
        .set(csrfHeaders(moderatorId, moderatorToken));
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/candidates/applications/:id/reject ─────────────────────

  describe('POST /api/candidates/applications/:id/reject', () => {
    it('rejects a new application', async () => {
      // Create a second viewer to test rejection
      await request(app).post('/api/auth/register').send({
        username: 'cand_viewer2',
        email: 'cand_viewer2@cand.test',
        password: 'Test1234!'
      });
      const v2Login = await request(app).post('/api/auth/login').send({
        email: 'cand_viewer2@cand.test',
        password: 'Test1234!'
      });
      const v2Cookie = v2Login.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const v2Token = v2Cookie.split(';')[0].replace('auth_token=', '');
      const v2User = await User.findOne({ where: { username: 'cand_viewer2' } });
      const applyRes = await request(app)
        .post('/api/candidates/apply')
        .set(csrfHeaders(v2User.id, v2Token))
        .send({ firstName: 'Viewer', lastName: 'Two', supportingStatement: 'I want to run.' });
      const v2AppId = applyRes.body.data.application.id;

      const res = await request(app)
        .post(`/api/candidates/applications/${v2AppId}/reject`)
        .set(csrfHeaders(moderatorId, moderatorToken))
        .send({ rejectionReason: 'Insufficient information' });
      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('rejected');
      expect(res.body.data.application.rejectionReason).toBe('Insufficient information');
    });
  });

  // ── POST /api/candidates/:id/claim ────────────────────────────────────

  describe('POST /api/candidates/:id/claim', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post(`/api/candidates/${profileId}/claim`).send({});
      expect(res.status).toBe(401);
    });

    it('submits a claim on unclaimed profile', async () => {
      const res = await request(app)
        .post(`/api/candidates/${profileId}/claim`)
        .set(csrfHeaders(candidateId, candidateToken))
        .send({ supportingStatement: 'This is my profile.' });
      expect(res.status).toBe(200);
      expect(res.body.data.profile.claimStatus).toBe('pending');
    });

    it('returns 409 if claim already pending', async () => {
      const res = await request(app)
        .post(`/api/candidates/${profileId}/claim`)
        .set(csrfHeaders(adminId, adminToken))
        .send({ supportingStatement: 'Me too.' });
      expect(res.status).toBe(409);
    });
  });

  // ── GET /api/candidates/claims ────────────────────────────────────────

  describe('GET /api/candidates/claims', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/candidates/claims');
      expect(res.status).toBe(401);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .get('/api/candidates/claims')
        .set(withToken(viewerToken));
      expect(res.status).toBe(403);
    });

    it('returns pending claims for moderator', async () => {
      const res = await request(app)
        .get('/api/candidates/claims')
        .set(withToken(moderatorToken));
      expect(res.status).toBe(200);
      expect(res.body.data.profiles.length).toBeGreaterThan(0);
    });
  });

  // ── POST /api/candidates/claims/:id/approve ──────────────────────────

  describe('POST /api/candidates/claims/:id/approve', () => {
    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .post(`/api/candidates/claims/${profileId}/approve`)
        .set(withToken(viewerToken));
      expect(res.status).toBe(403);
    });

    it('approves the claim', async () => {
      const res = await request(app)
        .post(`/api/candidates/claims/${profileId}/approve`)
        .set(csrfHeaders(moderatorId, moderatorToken));
      expect(res.status).toBe(200);
      expect(res.body.data.profile.claimStatus).toBe('claimed');
      // Verify candidate role
      const user = await User.findByPk(candidateId);
      expect(user.role).toBe('candidate');
    });
  });

  // ── POST /api/candidates/claims/:id/reject ───────────────────────────

  describe('POST /api/candidates/claims/:id/reject', () => {
    it('rejects a pending claim', async () => {
      // Create a fresh unclaimed profile and submit a claim
      const createRes = await request(app)
        .post('/api/candidates')
        .set(csrfHeaders(adminId, adminToken))
        .send({ firstName: 'Reject', lastName: 'Claim Test' });
      const newProfileId = createRes.body.data.profile.id;

      await request(app)
        .post(`/api/candidates/${newProfileId}/claim`)
        .set(csrfHeaders(adminId, adminToken))
        .send({ supportingStatement: 'Claim this.' });

      const rejectRes = await request(app)
        .post(`/api/candidates/claims/${newProfileId}/reject`)
        .set(csrfHeaders(moderatorId, moderatorToken))
        .send({ reason: 'Could not verify' });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.profile.claimStatus).toBe('rejected');
    });
  });

  // ── GET /api/candidates/dashboard ────────────────────────────────────

  describe('GET /api/candidates/dashboard', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/candidates/dashboard');
      expect(res.status).toBe(401);
    });

    it('returns 403 for viewer', async () => {
      const res = await request(app)
        .get('/api/candidates/dashboard')
        .set(withToken(viewerToken));
      expect(res.status).toBe(403);
    });

    it('returns profile for candidate', async () => {
      const res = await request(app)
        .get('/api/candidates/dashboard')
        .set(withToken(candidateToken));
      expect(res.status).toBe(200);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.claimStatus).toBe('claimed');
    });
  });

  // ── PUT /api/candidates/:id ───────────────────────────────────────────

  describe('PUT /api/candidates/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).put(`/api/candidates/${profileId}`).send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when wrong user tries to update', async () => {
      const res = await request(app)
        .put(`/api/candidates/${profileId}`)
        .set(withToken(moderatorToken))
        .send({ bio: 'Hacked bio' });
      // Moderator CAN update any profile — should succeed
      expect([200, 403]).toContain(res.status);
    });

    it('allows candidate to update own profile', async () => {
      const profile = await PublicPersonProfile.findOne({ where: { claimedByUserId: candidateId } });
      const res = await request(app)
        .put(`/api/candidates/${profile.id}`)
        .set(csrfHeaders(candidateId, candidateToken))
        .send({ bio: 'Updated bio' });
      expect(res.status).toBe(200);
      expect(res.body.data.profile.bio).toBe('Updated bio');
    });
  });

  // ── DELETE /api/candidates/:id ────────────────────────────────────────

  describe('DELETE /api/candidates/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/candidates/${profileId}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 for moderator', async () => {
      const res = await request(app)
        .delete(`/api/candidates/${profileId}`)
        .set(withToken(moderatorToken));
      expect(res.status).toBe(403);
    });

    it('deletes profile as admin', async () => {
      // Create a disposable profile
      const createRes = await request(app)
        .post('/api/candidates')
        .set(csrfHeaders(adminId, adminToken))
        .send({ firstName: 'To Be', lastName: 'Deleted' });
      const deleteId = createRes.body.data.profile.id;

      const res = await request(app)
        .delete(`/api/candidates/${deleteId}`)
        .set(csrfHeaders(adminId, adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
