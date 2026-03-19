const request = require('supertest');
const { sequelize, User, Endorsement } = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const endorsementRoutes = require('../src/routes/endorsementRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/endorsements', endorsementRoutes);

describe('Endorsement System Tests', () => {
  let userAToken, userAId;
  let userBToken, userBId;
  let userCToken, userCId;

  const csrfToken = 'test-csrf-token-endorsements';

  const csrfHeaders = (userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken
    };
  };

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const user = await User.findOne({ where: { username } });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: userAToken, id: userAId } = await registerAndLogin('end_userA'));
    ({ token: userBToken, id: userBId } = await registerAndLogin('end_userB'));
    ({ token: userCToken, id: userCId } = await registerAndLogin('end_userC'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── Topics endpoint ──────────────────────────────────────────────────────

  describe('GET /api/endorsements/topics', () => {
    it('returns the list of valid topics', async () => {
      const res = await request(app).get('/api/endorsements/topics');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.topics)).toBe(true);
      expect(res.body.data.topics).toContain('Education');
      expect(res.body.data.topics).toContain('Technology');
    });
  });

  // ── Create endorsement ───────────────────────────────────────────────────

  describe('POST /api/endorsements', () => {
    it('creates an endorsement when authenticated', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'Education' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.created).toBe(true);
    });

    it('is idempotent – duplicate endorsement returns created=false', async () => {
      // First endorsement
      await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'Health' });

      // Duplicate endorsement
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'Health' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.created).toBe(false);
    });

    it('blocks self-endorsement', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userAId, topic: 'Economy' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot endorse yourself/i);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .send({ endorsedUserId: userBId, topic: 'Technology' });

      expect(res.status).toBe(401);
    });

    it('rejects an invalid topic', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'InvalidTopic' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for a non-existent user', async () => {
      const res = await request(app)
        .post('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: 999999, topic: 'Technology' });

      expect(res.status).toBe(404);
    });
  });

  // ── Delete endorsement ───────────────────────────────────────────────────

  describe('DELETE /api/endorsements', () => {
    beforeAll(async () => {
      // Ensure endorsement exists before delete tests
      await Endorsement.findOrCreate({
        where: { endorserId: userAId, endorsedId: userBId, topic: 'Environment' }
      });
    });

    it('removes an existing endorsement', async () => {
      const res = await request(app)
        .delete('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'Environment' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.removed).toBe(true);
    });

    it('returns removed=false when endorsement did not exist', async () => {
      const res = await request(app)
        .delete('/api/endorsements')
        .set('Authorization', `Bearer ${userAToken}`)
        .set(csrfHeaders(userAId))
        .send({ endorsedUserId: userBId, topic: 'Technology' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.removed).toBe(false);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app)
        .delete('/api/endorsements')
        .send({ endorsedUserId: userBId, topic: 'Education' });

      expect(res.status).toBe(401);
    });
  });

  // ── Status endpoint ──────────────────────────────────────────────────────

  describe('GET /api/endorsements/status', () => {
    beforeAll(async () => {
      // Setup: userC endorses userB for Education and Economy
      await Endorsement.findOrCreate({
        where: { endorserId: userCId, endorsedId: userBId, topic: 'Education' }
      });
      await Endorsement.findOrCreate({
        where: { endorserId: userCId, endorsedId: userBId, topic: 'Economy' }
      });
    });

    it('returns endorsedTopics for the authenticated user', async () => {
      const res = await request(app)
        .get(`/api/endorsements/status?userId=${userBId}`)
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.endorsedTopics).toContain('Education');
      expect(res.body.data.endorsedTopics).toContain('Economy');
    });

    it('returns per-topic counts for the target user', async () => {
      const res = await request(app)
        .get(`/api/endorsements/status?userId=${userBId}`)
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topicCounts).toBeDefined();
      expect(res.body.data.topicCounts['Education']).toBeGreaterThanOrEqual(1);
      expect(res.body.data.topicCounts['Economy']).toBeGreaterThanOrEqual(1);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/endorsements/status?userId=${userBId}`);

      expect(res.status).toBe(401);
    });

    it('returns 400 for missing userId', async () => {
      const res = await request(app)
        .get('/api/endorsements/status')
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Leaderboard ──────────────────────────────────────────────────────────

  describe('GET /api/endorsements/leaderboard', () => {
    beforeAll(async () => {
      // Setup: ensure userB has more endorsements than userC
      await Endorsement.findOrCreate({
        where: { endorserId: userAId, endorsedId: userBId, topic: 'Technology' }
      });
      await Endorsement.findOrCreate({
        where: { endorserId: userCId, endorsedId: userBId, topic: 'Technology' }
      });
      // userC gets 1 endorsement for Technology
      await Endorsement.findOrCreate({
        where: { endorserId: userAId, endorsedId: userCId, topic: 'Technology' }
      });
    });

    it('returns users ranked by endorsement count (descending)', async () => {
      const res = await request(app)
        .get('/api/endorsements/leaderboard?topic=Technology');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const users = res.body.data.users;
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Verify descending order
      for (let i = 0; i < users.length - 1; i++) {
        expect(users[i].endorsementCount).toBeGreaterThanOrEqual(users[i + 1].endorsementCount);
      }
    });

    it('filters by topic correctly', async () => {
      const res = await request(app)
        .get('/api/endorsements/leaderboard?topic=Education');

      expect(res.status).toBe(200);
      const users = res.body.data.users;
      // All users returned should have at least 1 endorsement for Education
      expect(users.every((u) => u.endorsementCount >= 1)).toBe(true);
    });

    it('returns all topics leaderboard when no topic specified', async () => {
      const res = await request(app)
        .get('/api/endorsements/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topic).toBeNull();
    });

    it('returns 400 for an invalid topic', async () => {
      const res = await request(app)
        .get('/api/endorsements/leaderboard?topic=FakeTopic');

      expect(res.status).toBe(400);
    });

    it('includes pagination metadata', async () => {
      const res = await request(app)
        .get('/api/endorsements/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(typeof res.body.data.pagination.totalPages).toBe('number');
    });
  });
});
