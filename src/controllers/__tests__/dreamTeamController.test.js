const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../../config/securityHeaders');
const {
  sequelize,
  User,
  GovernmentPosition,
  DreamTeamVote,
} = require('../../models');
const authRoutes = require('../../routes/authRoutes');
const dreamTeamRoutes = require('../../routes/dreamTeamRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dream-team', dreamTeamRoutes);

describe('Dream Team API Tests', () => {
  let userToken, userId;
  let secondUserToken, secondUserId;
  let positionId;
  let candidateUserId;

  const csrfToken = 'test-csrf-dreamteam';
  const csrfHeaders = (uid, authToken) => {
    const { storeCsrfToken } = require('../../utils/csrf');
    storeCsrfToken(csrfToken, uid);
    return {
      Cookie: [`csrf_token=${csrfToken}`, `auth_token=${authToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  const withToken = (token) => ({ Cookie: [`auth_token=${token}`] });

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@dt.test`,
        password: 'Test1234!',
      });
      const user = await User.findOne({ where: { username } });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@dt.test`,
        password: 'Test1234!',
      });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: userToken, id: userId } = await registerAndLogin('dt_user1'));
    ({ token: secondUserToken, id: secondUserId } = await registerAndLogin('dt_user2'));

    // Seed a GR government position (used by voting tests)
    const pos = await GovernmentPosition.create({
      slug: 'prime_minister_test',
      title: 'Πρωθυπουργός',
      titleEn: 'Prime Minister',
      positionTypeKey: 'prime_minister',
      scope: 'national',
      countryCode: 'GR',
      order: 1,
      isActive: true,
    });
    positionId = pos.id;

    // Seed CY government positions (simulates the migration)
    const cyJson = require('../../../config/countries/CY.json');
    for (const p of cyJson.positions) {
      await GovernmentPosition.findOrCreate({
        where: { slug: p.slug },
        defaults: {
          slug: p.slug,
          title: p.title,
          titleEn: p.titleEn || null,
          positionTypeKey: p.positionTypeKey,
          scope: p.scope || 'national',
          countryCode: 'CY',
          order: p.order,
          isActive: true,
        },
      });
    }

    // Create a candidate user to vote for
    const candidateUser = await User.create({
      username: 'dt_candidate1',
      email: 'dt_candidate1@dt.test',
      password: null,
      role: 'viewer',
      firstNameNative: 'Δοκιμαστικός',
      lastNameNative: 'Πολιτικός',
    });
    candidateUserId = candidateUser.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/dream-team/positions ────────────────────────────────────────

  describe('GET /api/dream-team/positions', () => {
    it('returns 200 with positions array for public request', async () => {
      const res = await request(app).get('/api/dream-team/positions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('includes votes and myVote fields in each position', async () => {
      const res = await request(app).get('/api/dream-team/positions');
      expect(res.status).toBe(200);
      const position = res.body.data[0];
      expect(position).toHaveProperty('votes');
      expect(position).toHaveProperty('myVote');
      expect(Array.isArray(position.votes)).toBe(true);
    });

    it('returns Cyprus positions when countryCode=CY', async () => {
      const cyJson = require('../../../config/countries/CY.json');
      const res = await request(app).get('/api/dream-team/positions?countryCode=CY');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(cyJson.positions.length);
      res.body.data.forEach((pos) => {
        expect(pos.countryCode).toBe('CY');
      });
    });

    it('returns 500 on DB error (mocked)', async () => {
      const original = GovernmentPosition.findAll;
      GovernmentPosition.findAll = jest.fn().mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/dream-team/positions');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      GovernmentPosition.findAll = original;
    });
  });

  // ── POST /api/dream-team/vote ────────────────────────────────────────────

  describe('POST /api/dream-team/vote', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .send({ positionId, candidateUserId });
      expect(res.status).toBe(401);
    });

    it('returns 400 when positionId is missing', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ candidateUserId });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when candidateUserId is missing', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ positionId });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when position does not exist', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ positionId: 99999, candidateUserId });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when candidate user does not exist', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ positionId, candidateUserId: 99999 });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('creates a vote successfully', async () => {
      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ positionId, candidateUserId });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('positionId', positionId);
      expect(res.body.data).toHaveProperty('candidateUserId', candidateUserId);
      expect(res.body.data).toHaveProperty('personName');
      expect(res.body.message).toBe('Ψήφος καταγράφηκε επιτυχώς.');
    });

    it('upserts (updates) vote when user votes again for same position', async () => {
      // Create a second candidate user
      const candidate2 = await User.create({
        username: 'dt_candidate2',
        email: 'dt_candidate2@dt.test',
        password: null,
        role: 'viewer',
        firstNameNative: 'Άλλος',
        lastNameNative: 'Υποψήφιος',
      });

      const res = await request(app)
        .post('/api/dream-team/vote')
        .set(csrfHeaders(userId, userToken))
        .send({ positionId, candidateUserId: candidate2.id });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidateUserId).toBe(candidate2.id);

      // Only one vote should exist for this user+position
      const voteCount = await DreamTeamVote.count({ where: { userId, positionId } });
      expect(voteCount).toBe(1);
    });

    it('enforces unique constraint (userId, positionId) at DB level', async () => {
      // Attempt to insert two votes directly; second should fail
      await DreamTeamVote.destroy({ where: { userId: secondUserId, positionId } });
      await DreamTeamVote.create({ userId: secondUserId, positionId, candidateUserId, personName: 'Test' });
      await expect(
        DreamTeamVote.create({ userId: secondUserId, positionId, candidateUserId, personName: 'Dup' })
      ).rejects.toThrow();
    });
  });

  // ── GET /api/dream-team/results ──────────────────────────────────────────

  describe('GET /api/dream-team/results', () => {
    it('returns 200 with dream team array', async () => {
      const res = await request(app).get('/api/dream-team/results');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('each result has position and winner fields', async () => {
      const res = await request(app).get('/api/dream-team/results');
      expect(res.status).toBe(200);
      const item = res.body.data.find((r) => r.position.id === positionId);
      expect(item).toBeDefined();
      expect(item).toHaveProperty('position');
      expect(item).toHaveProperty('winner');
    });

    it('winner has correct fields when votes exist', async () => {
      const res = await request(app).get('/api/dream-team/results');
      const item = res.body.data.find((r) => r.position.id === positionId);
      if (item.winner) {
        expect(item.winner).toHaveProperty('candidateUserId');
        expect(item.winner).toHaveProperty('personName');
        expect(item.winner).toHaveProperty('voteCount');
        expect(item.winner).toHaveProperty('percentage');
      }
    });

    it('handles position with no votes gracefully (winner is null)', async () => {
      const emptyPos = await GovernmentPosition.create({
        slug: 'minister_empty_test',
        title: 'Υπουργός Δοκιμής',
        positionTypeKey: 'minister',
        scope: 'national',
        countryCode: 'GR',
        order: 99,
        isActive: true,
      });
      const res = await request(app).get('/api/dream-team/results');
      const item = res.body.data.find((r) => r.position.id === emptyPos.id);
      expect(item).toBeDefined();
      expect(item.winner).toBeNull();
      await emptyPos.destroy();
    });
  });

  // ── GET /api/dream-team/my-votes ─────────────────────────────────────────

  describe('GET /api/dream-team/my-votes', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/dream-team/my-votes');
      expect(res.status).toBe(401);
    });

    it('returns current user votes when authenticated', async () => {
      const res = await request(app)
        .get('/api/dream-team/my-votes')
        .set(withToken(userToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // The user voted above, so should have at least one vote
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('only returns votes for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/dream-team/my-votes')
        .set(withToken(userToken));
      expect(res.status).toBe(200);
      res.body.data.forEach((vote) => {
        expect(vote.userId).toBe(userId);
      });
    });
  });

  // ── GET /api/dream-team/countries ───────────────────────────────────────

  describe('GET /api/dream-team/countries', () => {
    it('returns 200 with a countries array', async () => {
      const res = await request(app).get('/api/dream-team/countries');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('includes GR in the countries list', async () => {
      const res = await request(app).get('/api/dream-team/countries');
      const codes = res.body.data.map((c) => c.countryCode);
      expect(codes).toContain('GR');
    });

    it('includes CY in the countries list', async () => {
      const res = await request(app).get('/api/dream-team/countries');
      const codes = res.body.data.map((c) => c.countryCode);
      expect(codes).toContain('CY');
    });

    it('each country entry has countryCode and positionCount fields', async () => {
      const res = await request(app).get('/api/dream-team/countries');
      res.body.data.forEach((c) => {
        expect(c).toHaveProperty('countryCode');
        expect(c).toHaveProperty('positionCount');
        expect(typeof c.positionCount).toBe('number');
        expect(c.positionCount).toBeGreaterThan(0);
      });
    });

    it('CY has the correct number of positions', async () => {
      const cyJson = require('../../../config/countries/CY.json');
      const res = await request(app).get('/api/dream-team/countries');
      const cy = res.body.data.find((c) => c.countryCode === 'CY');
      expect(cy).toBeDefined();
      expect(cy.positionCount).toBe(cyJson.positions.length);
    });
  });

  // ── GET /api/auth/users/search (used by dream-team search bar) ───────────

  describe('GET /api/auth/users/search', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/users/search?search=dtuser');
      expect(res.status).toBe(401);
    });

    it('returns searchable users for authenticated user', async () => {
      // Both users are searchable by default; search without query returns all
      await User.update({ searchable: true }, { where: { id: userId } });
      const res = await request(app)
        .get('/api/auth/users/search')
        .set(withToken(secondUserToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      const found = res.body.data.users.find((u) => u.id === userId);
      expect(found).toBeDefined();
    });

    it('does not return non-searchable users', async () => {
      await User.update({ searchable: false }, { where: { id: userId } });
      const res = await request(app)
        .get('/api/auth/users/search')
        .set(withToken(secondUserToken));
      expect(res.status).toBe(200);
      const found = res.body.data.users.find((u) => u.id === userId);
      expect(found).toBeUndefined();
    });

    it('returns empty array when search matches nothing', async () => {
      const res = await request(app)
        .get('/api/auth/users/search?search=zzznomatch999')
        .set(withToken(userToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(0);
    });

    it('returns results without search param (default listing)', async () => {
      await User.update({ searchable: true }, { where: { id: secondUserId } });
      const res = await request(app)
        .get('/api/auth/users/search')
        .set(withToken(userToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });
  });
});
