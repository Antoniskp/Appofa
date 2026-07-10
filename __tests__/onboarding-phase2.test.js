/**
 * Phase 2 onboarding backend tests
 *
 * Covers:
 * - GET /api/messages/mine/moderator-application (own application status, cross-user isolation)
 * - Duplicate pending moderator application prevention
 * - POST /api/messages — moderator_application with existing pending → 409
 * - GET /api/auth/contribution-summary (creator summary endpoint)
 * - Authentication and validation failures
 */

const request = require('supertest');
const express = require('express');
const { sequelize, User, Message, Article, Poll, Suggestion } = require('../src/models');
const authRoutes = require('../src/routes/authRoutes');
const messageRoutes = require('../src/routes/messageRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase2-test-secret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const csrfHeader = (token) => ({
  Cookie: [`csrf_token=${token}`],
  'x-csrf-token': token,
});

// ─── helpers ──────────────────────────────────────────────────────────────────

async function loginUser(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(res.status).toBe(200);
  const cookie = res.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  return cookie?.split(';')[0]?.replace('auth_token=', '');
}

async function createAndLoginUser(username, email, role = 'viewer') {
  const user = await User.create({
    username,
    email,
    password: 'Test1234!',
    role,
    emailVerified: true,
  });
  const token = await loginUser(email, 'Test1234!');
  return { user, token };
}

// ─── setup ────────────────────────────────────────────────────────────────────

describe('Phase 2 onboarding backend endpoints', () => {
  const csrf = 'phase2-csrf-token';

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── Moderator application status ──────────────────────────────────────────

  describe('GET /api/messages/mine/moderator-application', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/messages/mine/moderator-application');
      expect(res.status).toBe(401);
    });

    it('returns null application when user has no application', async () => {
      const { token, user } = await createAndLoginUser('noapp', 'noapp@test.com');
      storeCsrfToken(csrf, user.id);

      const res = await request(app)
        .get('/api/messages/mine/moderator-application')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application).toBeNull();
      expect(res.body.data.isApprovedModerator).toBe(false);
    });

    it('returns latest application status for authenticated user', async () => {
      const { token, user } = await createAndLoginUser('hasapp', 'hasapp@test.com');
      storeCsrfToken(csrf, user.id);

      await Message.create({
        type: 'moderator_application',
        userId: user.id,
        email: user.email,
        subject: 'Moderator Application',
        message: 'I want to be a moderator.',
        status: 'pending',
      });

      const res = await request(app)
        .get('/api/messages/mine/moderator-application')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { application } = res.body.data;
      expect(application).not.toBeNull();
      expect(application.status).toBe('pending');
      expect(application.stage).toBe('submitted');
      // Must not expose adminNotes
      expect(application.adminNotes).toBeUndefined();
    });

    it('maps status to user-friendly stage correctly', async () => {
      const { token, user } = await createAndLoginUser('stageuser', 'stage@test.com');
      storeCsrfToken(csrf, user.id);

      const cases = [
        { status: 'pending', expectedStage: 'submitted' },
        { status: 'read', expectedStage: 'under_review' },
        { status: 'in_progress', expectedStage: 'under_review' },
        { status: 'responded', expectedStage: 'decision_available' },
        { status: 'archived', expectedStage: 'closed' },
      ];

      for (const { status, expectedStage } of cases) {
        // Clear previous messages
        await Message.destroy({ where: { userId: user.id } });

        await Message.create({
          type: 'moderator_application',
          userId: user.id,
          email: user.email,
          subject: 'Moderator test',
          message: 'Test.',
          status,
        });

        const res = await request(app)
          .get('/api/messages/mine/moderator-application')
          .set('Cookie', [`auth_token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.data.application.stage).toBe(expectedStage);
      }
    });

    it('derives isApprovedModerator from actual user role', async () => {
      const { token, user } = await createAndLoginUser('moduser', 'mod@test.com', 'moderator');
      storeCsrfToken(csrf, user.id);

      const res = await request(app)
        .get('/api/messages/mine/moderator-application')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.isApprovedModerator).toBe(true);
    });

    it('does NOT return another user\'s application (cross-user isolation)', async () => {
      const { token: tokenA, user: userA } = await createAndLoginUser('usera', 'usera@test.com');
      const { user: userB } = await createAndLoginUser('userb', 'userb@test.com');
      storeCsrfToken(csrf, userA.id);
      storeCsrfToken(csrf, userB.id);

      // Create an application for user B
      await Message.create({
        type: 'moderator_application',
        userId: userB.id,
        email: userB.email,
        subject: 'User B application',
        message: 'User B wants to be moderator.',
        status: 'pending',
      });

      // User A should see no application
      const res = await request(app)
        .get('/api/messages/mine/moderator-application')
        .set('Cookie', [`auth_token=${tokenA}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.application).toBeNull();
    });

    it('does NOT expose response from other users', async () => {
      const { token, user } = await createAndLoginUser('withresp', 'withresp@test.com');
      storeCsrfToken(csrf, user.id);

      await Message.create({
        type: 'moderator_application',
        userId: user.id,
        email: user.email,
        subject: 'Moderator app with response',
        message: 'Application message.',
        status: 'responded',
        response: 'Approved, welcome!',
        adminNotes: 'Internal admin note — must not be exposed',
      });

      const res = await request(app)
        .get('/api/messages/mine/moderator-application')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      const app_ = res.body.data.application;
      // response IS exposed (user needs to read it)
      expect(app_.response).toBe('Approved, welcome!');
      // adminNotes must NOT be exposed
      expect(app_.adminNotes).toBeUndefined();
    });
  });

  // ── Duplicate application prevention ─────────────────────────────────────

  describe('POST /api/messages — duplicate moderator application prevention', () => {
    it('returns 409 when authenticated user already has a pending application', async () => {
      const { token, user } = await createAndLoginUser('duptest', 'dup@test.com');
      storeCsrfToken(csrf, user.id);

      // Create existing pending application
      await Message.create({
        type: 'moderator_application',
        userId: user.id,
        email: user.email,
        subject: 'First application',
        message: 'I want to be moderator.',
        status: 'pending',
      });

      // Try to submit another
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({
          type: 'moderator_application',
          subject: 'Second application attempt',
          message: 'I want to apply again.',
          locationId: null,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.data.existingApplicationId).toBeDefined();
    });

    it('returns 409 for in_progress status too', async () => {
      const { token, user } = await createAndLoginUser('inprogress', 'inprog@test.com');
      storeCsrfToken(csrf, user.id);

      await Message.create({
        type: 'moderator_application',
        userId: user.id,
        email: user.email,
        subject: 'In-progress application',
        message: 'Application in review.',
        status: 'in_progress',
      });

      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({
          type: 'moderator_application',
          subject: 'Reapply attempt',
          message: 'Trying again.',
        });

      expect(res.status).toBe(409);
    });

    it('allows new application when previous is archived (closed)', async () => {
      const { token, user } = await createAndLoginUser('archtest', 'arch@test.com');
      storeCsrfToken(csrf, user.id);

      await Message.create({
        type: 'moderator_application',
        userId: user.id,
        email: user.email,
        subject: 'Old archived application',
        message: 'Old application.',
        status: 'archived',
      });

      // No Location in SQLite test; we skip locationId validation here since
      // this test focuses on duplicate check. We expect 400 for missing location
      // (not 409), confirming the duplicate check was passed.
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({
          type: 'moderator_application',
          subject: 'New application after archive',
          message: 'Trying again after closure.',
        });

      // Should be 400 (missing location) not 409 (duplicate)
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).not.toMatch(/pending/i);
    });

    it('allows non-authenticated users to submit without duplicate check', async () => {
      // Guest submission should be allowed even if other pending apps exist
      // The duplicate check only applies to authenticated users
      const res = await request(app)
        .post('/api/messages')
        .send({
          type: 'moderator_application',
          email: 'guest@test.com',
          name: 'Guest User',
          subject: 'Guest application',
          message: 'Guest wants to moderate.',
        });

      // Should fail for missing location (not 409)
      expect(res.status).toBe(400);
      expect(res.body.data?.existingApplicationId).toBeUndefined();
    });
  });

  // ── Creator contribution summary ──────────────────────────────────────────

  describe('GET /api/auth/contribution-summary', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/contribution-summary');
      expect(res.status).toBe(401);
    });

    it('returns zero counts when user has no content', async () => {
      const { token, user } = await createAndLoginUser('nocontent', 'nocontent@test.com');
      storeCsrfToken(csrf, user.id);

      const res = await request(app)
        .get('/api/auth/contribution-summary')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { summary } = res.body.data;
      expect(summary.hasContributed).toBe(false);
      expect(summary.totalCount).toBe(0);
      expect(summary.articleCount).toBe(0);
      expect(summary.pollCount).toBe(0);
      expect(summary.suggestionCount).toBe(0);
    });

    it('reflects articles authored by the user', async () => {
      const { token, user } = await createAndLoginUser('hasarticle', 'hasarticle@test.com');
      storeCsrfToken(csrf, user.id);

      await Article.create({
        authorId: user.id,
        title: 'Test article here',
        content: 'Article content body text.',
        type: 'articles',
        status: 'draft',
      });

      const res = await request(app)
        .get('/api/auth/contribution-summary')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      expect(summary.hasContributed).toBe(true);
      expect(summary.articleCount).toBe(1);
      expect(summary.totalCount).toBe(1);
    });

    it('reflects polls created by the user', async () => {
      const { token, user } = await createAndLoginUser('haspoll', 'haspoll@test.com');
      storeCsrfToken(csrf, user.id);

      await Poll.create({
        creatorId: user.id,
        title: 'Test poll question',
        description: 'Poll description',
        status: 'active',
        visibility: 'public',
        voteRestriction: 'authenticated',
        type: 'binary',
      });

      const res = await request(app)
        .get('/api/auth/contribution-summary')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      expect(summary.hasContributed).toBe(true);
      expect(summary.pollCount).toBe(1);
    });

    it('does not include other users\' content in count', async () => {
      const { token: tokenA, user: userA } = await createAndLoginUser('contenta', 'contenta@test.com');
      const { user: userB } = await createAndLoginUser('contentb', 'contentb@test.com');
      storeCsrfToken(csrf, userA.id);

      // User B creates an article
      await Article.create({
        authorId: userB.id,
        title: 'User B article title',
        content: 'Content body text here.',
        type: 'articles',
        status: 'draft',
      });

      // User A's summary should remain zero
      const res = await request(app)
        .get('/api/auth/contribution-summary')
        .set('Cookie', [`auth_token=${tokenA}`]);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;
      expect(summary.hasContributed).toBe(false);
      expect(summary.totalCount).toBe(0);
    });
  });
});
