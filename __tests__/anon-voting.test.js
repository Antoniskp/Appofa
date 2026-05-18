/**
 * Tests for anonymous voting on civic questions and suggestions.
 *
 * Covers:
 * - Civic question: unauthenticated vote allowed when voteRestriction = 'anyone'
 * - Civic question: unauthenticated vote rejected when voteRestriction = 'authenticated'
 * - Suggestion: unauthenticated vote allowed when voteRestriction = 'anyone'
 * - Suggestion: unauthenticated vote rejected when voteRestriction = 'authenticated'
 * - Anonymous myVote returned correctly via device fingerprint
 * - Device-fingerprint deduplication (same IP+UA cannot vote twice)
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const {
  sequelize,
  User,
  Location,
  CivicQuestion,
  CivicQuestionVote,
  Suggestion,
  SuggestionVote,
} = require('../src/models');

const authRoutes = require('../src/routes/authRoutes');
const civicQuestionRoutes = require('../src/routes/civicQuestionRoutes');
const suggestionRoutes = require('../src/routes/suggestionRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = 'test-jwt-secret-anon-voting';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/civic-questions', civicQuestionRoutes);
app.use('/api/suggestions', suggestionRoutes);

const csrfHeadersFor = (token, userId) => {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  };
};

async function registerAndLogin(username) {
  await User.create({
    username,
    email: `${username}@anontest.com`,
    password: 'Test1234!',
    role: 'viewer',
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@anontest.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  const user = await User.findOne({ where: { email: `${username}@anontest.com` } });
  return { token, id: user.id };
}

describe('Anonymous Voting', () => {
  let creator;
  let creatorCsrf;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    creator = await registerAndLogin('anon_creator');
    creatorCsrf = 'csrf-anon-creator';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ─── Civic Questions ──────────────────────────────────────────────────────

  describe('Civic Questions — anonymous voting', () => {
    let openAnyoneId;
    let openAuthId;

    beforeAll(async () => {
      const headers = csrfHeadersFor(creatorCsrf, creator.id);

      const r1 = await request(app)
        .post('/api/civic-questions')
        .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
        .set('x-csrf-token', creatorCsrf)
        .send({
          title: 'Civic Anyone Vote',
          sourceType: 'parliament',
          voteRestriction: 'anyone',
        });
      openAnyoneId = r1.body.data.id;

      const r2 = await request(app)
        .post('/api/civic-questions')
        .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
        .set('x-csrf-token', creatorCsrf)
        .send({
          title: 'Civic Auth Vote',
          sourceType: 'parliament',
          voteRestriction: 'authenticated',
        });
      openAuthId = r2.body.data.id;
    });

    test('anonymous user can vote when voteRestriction is anyone', async () => {
      const res = await request(app)
        .post(`/api/civic-questions/${openAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.0.0.1')
        .set('User-Agent', 'TestBrowser/1.0')
        .send({ choice: 'agree' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.myVote).toBe('agree');
      expect(res.body.data.voteCounts.agree).toBeGreaterThanOrEqual(1);
    });

    test('anonymous user cannot vote twice (device fingerprint deduplication)', async () => {
      // First vote
      await request(app)
        .post(`/api/civic-questions/${openAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.0.0.2')
        .set('User-Agent', 'TestBrowser/2.0')
        .send({ choice: 'agree' });

      // Second vote with same fingerprint should update/replace, not create a duplicate
      const res = await request(app)
        .post(`/api/civic-questions/${openAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.0.0.2')
        .set('User-Agent', 'TestBrowser/2.0')
        .send({ choice: 'disagree' });

      expect(res.status).toBe(200);
      expect(res.body.data.myVote).toBe('disagree');

      // Verify only one row in DB for this device
      const rows = await CivicQuestionVote.findAll({
        where: { civicQuestionId: openAnyoneId, ipAddress: '10.0.0.2', userAgent: 'TestBrowser/2.0' },
      });
      expect(rows).toHaveLength(1);
    });

    test('anonymous user is blocked when voteRestriction is authenticated', async () => {
      const res = await request(app)
        .post(`/api/civic-questions/${openAuthId}/vote`)
        .set('X-Forwarded-For', '10.0.0.3')
        .set('User-Agent', 'TestBrowser/3.0')
        .send({ choice: 'agree' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('getById returns anonymous user myVote via fingerprint', async () => {
      // Ensure a vote exists for this fingerprint
      await request(app)
        .post(`/api/civic-questions/${openAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.0.0.5')
        .set('User-Agent', 'FingerTest/1.0')
        .send({ choice: 'present' });

      // Now fetch the question as the same anon user
      const res = await request(app)
        .get(`/api/civic-questions/${openAnyoneId}`)
        .set('X-Forwarded-For', '10.0.0.5')
        .set('User-Agent', 'FingerTest/1.0');

      expect(res.status).toBe(200);
      expect(res.body.data.myVote).toBe('present');
    });
  });

  // ─── Suggestions ─────────────────────────────────────────────────────────

  describe('Suggestions — anonymous voting', () => {
    let suggAnyoneId;
    let suggAuthId;

    beforeAll(async () => {
      const headers = csrfHeadersFor(creatorCsrf, creator.id);

      const r1 = await request(app)
        .post('/api/suggestions')
        .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
        .set('x-csrf-token', creatorCsrf)
        .send({
          title: 'Suggestion Anyone Vote',
          body: 'This suggestion allows anonymous voting.',
          type: 'idea',
          voteRestriction: 'anyone',
        });
      suggAnyoneId = r1.body.data.id;

      const r2 = await request(app)
        .post('/api/suggestions')
        .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
        .set('x-csrf-token', creatorCsrf)
        .send({
          title: 'Suggestion Auth Vote',
          body: 'This suggestion requires authentication for voting.',
          type: 'idea',
          voteRestriction: 'authenticated',
        });
      suggAuthId = r2.body.data.id;
    });

    test('anonymous user can vote when voteRestriction is anyone', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${suggAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.1.0.1')
        .set('User-Agent', 'SuggBrowser/1.0')
        .send({ value: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upvotes).toBeGreaterThanOrEqual(1);
      expect(res.body.data.myVote).toBe(1);
    });

    test('anonymous user cannot vote twice (device fingerprint deduplication)', async () => {
      // First vote
      await request(app)
        .post(`/api/suggestions/${suggAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.1.0.2')
        .set('User-Agent', 'SuggBrowser/2.0')
        .send({ value: 1 });

      // Second vote with same fingerprint toggles off (same value removes)
      const res = await request(app)
        .post(`/api/suggestions/${suggAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.1.0.2')
        .set('User-Agent', 'SuggBrowser/2.0')
        .send({ value: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.myVote).toBe(null);

      // Verify no vote row remains
      const rows = await SuggestionVote.findAll({
        where: {
          targetType: 'suggestion',
          targetId: suggAnyoneId,
          ipAddress: '10.1.0.2',
          userAgent: 'SuggBrowser/2.0',
        },
      });
      expect(rows).toHaveLength(0);
    });

    test('anonymous user is blocked when voteRestriction is authenticated', async () => {
      const res = await request(app)
        .post(`/api/suggestions/${suggAuthId}/vote`)
        .set('X-Forwarded-For', '10.1.0.3')
        .set('User-Agent', 'SuggBrowser/3.0')
        .send({ value: 1 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('getById returns anonymous user myVote via fingerprint', async () => {
      // Ensure a vote exists for this fingerprint
      await request(app)
        .post(`/api/suggestions/${suggAnyoneId}/vote`)
        .set('X-Forwarded-For', '10.1.0.5')
        .set('User-Agent', 'SuggFinger/1.0')
        .send({ value: -1 });

      const res = await request(app)
        .get(`/api/suggestions/${suggAnyoneId}`)
        .set('X-Forwarded-For', '10.1.0.5')
        .set('User-Agent', 'SuggFinger/1.0');

      expect(res.status).toBe(200);
      expect(res.body.data.myVote).toBe(-1);
    });
  });
});
