/**
 * Suggestions & Solutions API Tests
 *
 * Tests cover:
 *  - Creating suggestions (auth required)
 *  - Creating solutions (auth required)
 *  - Upvote/downvote behavior: create, change, toggle-off
 *  - Uniqueness constraint (no duplicate votes)
 *  - Score aggregation correctness
 *  - Ordering: solutions sorted by score desc
 *  - Permissions: unauthenticated requests rejected
 */

const request = require('supertest');
const {
  sequelize,
  User,
  Location,
  Suggestion,
  Solution,
  SuggestionVote
} = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const suggestionRoutes = require('../src/routes/suggestionRoutes');
const solutionRoutes = require('../src/routes/solutionRoutes');

// Set test env vars
process.env.JWT_SECRET = 'test-jwt-secret-suggestions';
process.env.NODE_ENV = 'test';

// Build minimal test app
const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/solutions', solutionRoutes);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { storeCsrfToken } = require('../src/utils/csrf');

function csrfHeadersFor(token, userId) {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token
  };
}

async function registerAndLogin(appInstance, username, role = 'viewer') {
  await User.create({
    username,
    email: `${username}@test.com`,
    password: 'Test1234!',
    role
  });
  const user = await User.findOne({ where: { username } });
  const loginRes = await request(appInstance)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) =>
    c.startsWith('auth_token=')
  );
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Suggestions & Solutions API Tests', () => {
  let user1Token, user1Id;
  let user2Token, user2Id;
  let adminToken, adminId;
  let moderatorToken, moderatorId;

  let testSuggestionId;
  let testSolutionId;

  const csrf1 = 'csrf-suggestions-user1';
  const csrf2 = 'csrf-suggestions-user2';
  const csrfAdmin = 'csrf-suggestions-admin';
  const csrfMod = 'csrf-suggestions-mod';

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    ({ token: user1Token, id: user1Id } = await registerAndLogin(app, 'sug_user1', 'viewer'));
    ({ token: user2Token, id: user2Id } = await registerAndLogin(app, 'sug_user2', 'viewer'));
    ({ token: adminToken, id: adminId } = await registerAndLogin(app, 'sug_admin', 'admin'));
    ({ token: moderatorToken, id: moderatorId } = await registerAndLogin(app, 'sug_mod', 'moderator'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ─── GET /api/suggestions (list) ────────────────────────────────────────────

  describe('GET /api/suggestions', () => {
    it('should return an empty list when no suggestions exist', async () => {
      const res = await request(app).get('/api/suggestions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should be accessible without authentication', async () => {
      const res = await request(app).get('/api/suggestions');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/suggestions ───────────────────────────────────────────────────

  describe('POST /api/suggestions', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .send({ title: 'Need a park', body: 'We need a new park here.', type: 'idea' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with missing title', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ body: 'We need a new park here.', type: 'idea' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with too-short title', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ title: 'Hi', body: 'We need a new park here.', type: 'idea' });
      expect(res.status).toBe(400);
    });

    it('should reject request with missing body', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ title: 'Need a park', type: 'idea' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ title: 'Need a park', body: 'We need a new park here with space.', type: 'banana' });
      expect(res.status).toBe(400);
    });

    it('should create a suggestion when authenticated', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ title: 'Need a park', body: 'We need a new park in our neighbourhood.', type: 'idea' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        title: 'Need a park',
        type: 'idea',
        status: 'open',
        score: 0,
        myVote: null
      });
      testSuggestionId = res.body.data.id;
      expect(testSuggestionId).toBeTruthy();
    });

    it('should set authorId to the authenticated user', async () => {
      const suggestion = await Suggestion.findByPk(testSuggestionId);
      expect(suggestion.authorId).toBe(user1Id);
    });

    it('should default status to open', async () => {
      const suggestion = await Suggestion.findByPk(testSuggestionId);
      expect(suggestion.status).toBe('open');
    });
  });

  // ─── GET /api/suggestions/:id ────────────────────────────────────────────────

  describe('GET /api/suggestions/:id', () => {
    it('should return 404 for non-existent suggestion', async () => {
      const res = await request(app).get('/api/suggestions/999999');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).get('/api/suggestions/abc');
      expect(res.status).toBe(400);
    });

    it('should return the suggestion with score and solutions', async () => {
      const res = await request(app).get(`/api/suggestions/${testSuggestionId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: testSuggestionId,
        score: 0,
        myVote: null,
        solutions: []
      });
    });
  });

  // ─── POST /api/suggestions/:id/solutions ─────────────────────────────────────

  describe('POST /api/suggestions/:id/solutions', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/solutions`)
        .send({ body: 'Build a community garden here.' });
      expect(res.status).toBe(401);
    });

    it('should reject short body', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/solutions`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ body: 'Too short' });
      expect(res.status).toBe(400);
    });

    it('should create a solution under the suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/solutions`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ body: 'Build a community garden and add some benches for residents.' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ score: 0, myVote: null });
      testSolutionId = res.body.data.id;
      expect(testSolutionId).toBeTruthy();
    });

    it('should return 404 for non-existent suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions/999999/solutions')
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ body: 'This solution is for a missing suggestion.' });
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/suggestions/:id/vote ──────────────────────────────────────────

  describe('Suggestion voting', () => {
    it('should reject unauthenticated vote with 401', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .send({ value: 1 });
      expect(res.status).toBe(401);
    });

    it('should reject invalid vote value', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 5 });
      expect(res.status).toBe(400);
    });

    it('should upvote a suggestion (score becomes 1)', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.myVote).toBe(1);
    });

    it('should change upvote to downvote (score becomes -1)', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: -1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(-1);
      expect(res.body.data.myVote).toBe(-1);
    });

    it('should toggle off by voting same value again (score becomes 0)', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: -1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.myVote).toBeNull();
    });

    it('should enforce one vote per user (no duplicate votes in DB)', async () => {
      // user1 upvotes
      await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });

      // Try to insert a duplicate vote directly in DB – should fail
      let threw = false;
      try {
        await SuggestionVote.create({
          userId: user1Id,
          targetType: 'suggestion',
          targetId: testSuggestionId,
          value: 1
        });
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it('should aggregate scores from multiple voters correctly', async () => {
      // user1 already voted +1 above; user2 also upvotes → score should be 2
      const res = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(2);
    });

    it('should reflect myVote correctly for caller when fetching suggestion', async () => {
      // user1 has +1, user2 has +1
      const res = await request(app)
        .get(`/api/suggestions/${testSuggestionId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set('Cookie', [`auth_token=${user1Token}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(2);
      expect(res.body.data.myVote).toBe(1);
    });
  });

  // ─── POST /api/solutions/:id/vote ─────────────────────────────────────────────

  describe('Solution voting', () => {
    it('should reject unauthenticated vote on solution with 401', async () => {
      const res = await request(app)
        .post(`/api/solutions/${testSolutionId}/vote`)
        .send({ value: 1 });
      expect(res.status).toBe(401);
    });

    it('should upvote a solution', async () => {
      const res = await request(app)
        .post(`/api/solutions/${testSolutionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.myVote).toBe(1);
    });

    it('should downvote a solution (change vote)', async () => {
      const res = await request(app)
        .post(`/api/solutions/${testSolutionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: -1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(-1);
      expect(res.body.data.myVote).toBe(-1);
    });

    it('should toggle off solution vote', async () => {
      const res = await request(app)
        .post(`/api/solutions/${testSolutionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: -1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.myVote).toBeNull();
    });

    it('should return 404 when voting on non-existent solution', async () => {
      const res = await request(app)
        .post('/api/solutions/999999/vote')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      expect(res.status).toBe(404);
    });
  });

  // ─── Solutions sorted by score desc ───────────────────────────────────────────

  describe('Solutions sorted by score descending', () => {
    let solLowId, solHighId;

    beforeAll(async () => {
      // Create two more solutions
      const res1 = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/solutions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ body: 'Low-score solution: just plant some trees along the road.' });
      solLowId = res1.body.data.id;

      const res2 = await request(app)
        .post(`/api/suggestions/${testSuggestionId}/solutions`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ body: 'High-score solution: build a full community centre with amenities.' });
      solHighId = res2.body.data.id;

      // Give solHighId +2 votes, solLowId +1 vote
      await request(app)
        .post(`/api/solutions/${solHighId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      await request(app)
        .post(`/api/solutions/${solHighId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ value: 1 });
      await request(app)
        .post(`/api/solutions/${solLowId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
    });

    it('should return solutions sorted by score desc in suggestion detail', async () => {
      const res = await request(app).get(`/api/suggestions/${testSuggestionId}`);
      expect(res.status).toBe(200);
      const solutions = res.body.data.solutions;
      expect(solutions.length).toBeGreaterThanOrEqual(2);
      // Verify descending order
      for (let i = 0; i < solutions.length - 1; i++) {
        expect(solutions[i].score).toBeGreaterThanOrEqual(solutions[i + 1].score);
      }
    });

    it('should return solutions sorted by score desc via /solutions endpoint', async () => {
      const res = await request(app).get(`/api/suggestions/${testSuggestionId}/solutions`);
      expect(res.status).toBe(200);
      const solutions = res.body.data;
      expect(solutions.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < solutions.length - 1; i++) {
        expect(solutions[i].score).toBeGreaterThanOrEqual(solutions[i + 1].score);
      }
    });

    it('should have the highest-score solution first', async () => {
      const res = await request(app).get(`/api/suggestions/${testSuggestionId}/solutions`);
      expect(res.status).toBe(200);
      const solutions = res.body.data;
      const topSol = solutions.find((s) => s.id === solHighId);
      expect(topSol).toBeTruthy();
      expect(solutions[0].id).toBe(solHighId);
    });
  });

  // ─── PATCH /api/suggestions/:id ──────────────────────────────────────────────

  describe('PATCH /api/suggestions/:id', () => {
    it('should reject unauthenticated updates', async () => {
      const res = await request(app)
        .patch(`/api/suggestions/${testSuggestionId}`)
        .send({ status: 'under_review' });
      expect(res.status).toBe(401);
    });

    it('should reject update by non-owner non-admin', async () => {
      const res = await request(app)
        .patch(`/api/suggestions/${testSuggestionId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ status: 'under_review' });
      expect(res.status).toBe(403);
    });

    it('should allow owner to update suggestion', async () => {
      const res = await request(app)
        .patch(`/api/suggestions/${testSuggestionId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ status: 'under_review' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('under_review');
    });

    it('should allow admin to update any suggestion', async () => {
      const res = await request(app)
        .patch(`/api/suggestions/${testSuggestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ status: 'implemented' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('implemented');
    });
  });

  // ─── GET /api/suggestions filtering and pagination ───────────────────────────

  describe('GET /api/suggestions (filters & pagination)', () => {
    beforeAll(async () => {
      // Create a few more suggestions for filter testing
      await Suggestion.create({
        title: 'Fix the broken road near school',
        body: 'The road near the school has multiple large potholes that need urgent repair.',
        type: 'problem',
        status: 'open',
        authorId: user2Id
      });
      await Suggestion.create({
        title: 'Add a bus stop on main street',
        body: 'We need a dedicated bus stop with shelter on the main street.',
        type: 'location_suggestion',
        status: 'open',
        authorId: user1Id
      });
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/suggestions?type=problem');
      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.type === 'problem')).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/suggestions?status=open');
      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.status === 'open')).toBe(true);
    });

    it('should ignore unknown filter type gracefully', async () => {
      const res = await request(app).get('/api/suggestions?type=banana');
      expect(res.status).toBe(200);
      // Unknown type is silently ignored; returns all
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should return pagination metadata', async () => {
      const res = await request(app).get('/api/suggestions?limit=2&page=1');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it('should sort by newest by default', async () => {
      const res = await request(app).get('/api/suggestions?sort=newest');
      expect(res.status).toBe(200);
      const dates = res.body.data.map((s) => new Date(s.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should sort by top (score desc)', async () => {
      const res = await request(app).get('/api/suggestions?sort=top');
      expect(res.status).toBe(200);
      const scores = res.body.data.map((s) => s.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });
  });

  describe('Suggestion visibility and vote restrictions', () => {
    let parentLocationId;
    let childLocationId;
    let outsiderLocationId;
    let localsOnlySuggestionId;
    let privateSuggestionId;

    beforeAll(async () => {
      const country = await Location.create({ name: 'Greece', type: 'country', slug: 'greece-test-sug' });
      const prefecture = await Location.create({ name: 'Attica', type: 'prefecture', slug: 'attica-test-sug', parent_id: country.id });
      const municipality = await Location.create({ name: 'Athens', type: 'municipality', slug: 'athens-test-sug', parent_id: prefecture.id });
      const outsiderMunicipality = await Location.create({ name: 'Patra', type: 'municipality', slug: 'patra-test-sug', parent_id: prefecture.id });

      parentLocationId = country.id;
      childLocationId = municipality.id;
      outsiderLocationId = outsiderMunicipality.id;

      await User.update({ homeLocationId: childLocationId }, { where: { id: user1Id } });
      await User.update({ homeLocationId: outsiderLocationId }, { where: { id: user2Id } });

      const localsCreate = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({
          title: 'Local traffic issue',
          body: 'Need better traffic management in our local area urgently.',
          type: 'problem',
          locationId: childLocationId,
          visibility: 'public',
          voteRestriction: 'locals_only'
        });

      localsOnlySuggestionId = localsCreate.body.data.id;

      const privateCreate = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({
          title: 'Private planning thread',
          body: 'This should be visible only to authenticated users for planning.',
          type: 'idea',
          visibility: 'private'
        });

      privateSuggestionId = privateCreate.body.data.id;
    });

    it('should include voteRestriction in create response', async () => {
      const res = await request(app).get(`/api/suggestions/${localsOnlySuggestionId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.voteRestriction).toBe('locals_only');
      expect(res.body.data.visibility).toBe('public');
    });

    it('should hide private suggestions from unauthenticated listing', async () => {
      const res = await request(app).get('/api/suggestions');
      expect(res.status).toBe(200);
      const ids = res.body.data.map((s) => s.id);
      expect(ids).not.toContain(privateSuggestionId);
    });

    it('should allow authenticated listing to include private suggestions', async () => {
      const res = await request(app)
        .get('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set('Cookie', [`auth_token=${user1Token}`]);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((s) => s.id);
      expect(ids).toContain(privateSuggestionId);
    });

    it('should filter by parent location and include descendant-tagged suggestions', async () => {
      const res = await request(app).get(`/api/suggestions?locationId=${parentLocationId}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((s) => s.id);
      expect(ids).toContain(localsOnlySuggestionId);
    });

    it('should deny vote on locals_only suggestion for non-local user', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${localsOnlySuggestionId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ value: 1 });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow vote on locals_only suggestion for local user', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${localsOnlySuggestionId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.myVote).toBe(1);
    });
  });

  // ─── problem_request type — flows ────────────────────────────────────────────

  describe('problem_request type — flows', () => {
    let problemRequestId;
    let ideaSuggestionId;
    let problemSuggestionId;

    it('should allow any authenticated user to create a problem_request suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({
          title: 'Ποιο είναι το μεγαλύτερο πρόβλημα;',
          body: 'Πείτε μας ποιο είναι το μεγαλύτερο πρόβλημα στη γειτονιά σας.',
          type: 'problem_request'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('problem_request');
      problemRequestId = res.body.data.id;
    });

    it('should allow admin to create a problem_request suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({
          title: 'Ποιο είναι το μεγαλύτερο πρόβλημα στην πόλη;',
          body: 'Θέλουμε να ακούσουμε τα μεγαλύτερα προβλήματα που αντιμετωπίζετε.',
          type: 'problem_request'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('problem_request');
    });

    it('should allow moderator to create a problem_request suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeadersFor(csrfMod, moderatorId))
        .send({
          title: 'Μοιραστείτε τα προβλήματα της γειτονιάς σας',
          body: 'Αναφέρετε τα βασικά ζητήματα που αντιμετωπίζετε στην περιοχή σας.',
          type: 'problem_request'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('problem_request');
    });

    it('should allow any user to create an idea suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({
          title: 'Ιδέα για νέο πάρκο στην πόλη',
          body: 'Θα ήθελα να προτείνω τη δημιουργία ενός νέου πάρκου στο κέντρο.',
          type: 'idea'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('idea');
      ideaSuggestionId = res.body.data.id;
    });

    it('should allow any user to create a problem suggestion', async () => {
      const res = await request(app)
        .post('/api/suggestions')
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({
          title: 'Πρόβλημα με τα σκουπίδια στην πλατεία',
          body: 'Τα σκουπίδια δεν μαζεύονται εδώ και δύο εβδομάδες στην κεντρική πλατεία.',
          type: 'problem'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('problem');
      problemSuggestionId = res.body.data.id;
    });

    it('should allow users to add responses to a problem_request suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${problemRequestId}/solutions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ body: 'Το μεγαλύτερο πρόβλημα είναι η έλλειψη φωτισμού στους δρόμους.' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should allow users to add responses to an idea suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${ideaSuggestionId}/solutions`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ body: 'Εξαιρετική ιδέα! Το πάρκο θα βελτίωνε σημαντικά τη ζωή στην πόλη.' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should allow users to vote on a problem_request suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${problemRequestId}/vote`)
        .set('Authorization', `Bearer ${user1Token}`)
        .set(csrfHeadersFor(csrf1, user1Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.myVote).toBe(1);
    });

    it('should allow users to vote on an idea suggestion', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${ideaSuggestionId}/vote`)
        .set('Authorization', `Bearer ${user2Token}`)
        .set(csrfHeadersFor(csrf2, user2Id))
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(1);
    });

    it('should filter by problem_request type', async () => {
      const res = await request(app).get('/api/suggestions?type=problem_request');
      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.type === 'problem_request')).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by idea type', async () => {
      const res = await request(app).get('/api/suggestions?type=idea');
      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.type === 'idea')).toBe(true);
    });

    it('should filter by problem type', async () => {
      const res = await request(app).get('/api/suggestions?type=problem');
      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.type === 'problem')).toBe(true);
    });
  });
});
