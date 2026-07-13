const request = require('supertest');
const {
  sequelize,
  User,
  Location,
  CivicQuestion,
  CivicQuestionVote,
} = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const civicQuestionRoutes = require('../src/routes/civicQuestionRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = 'test-jwt-secret-civic-questions';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/civic-questions', civicQuestionRoutes);

const csrfHeadersFor = (token, userId) => {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  };
};

async function registerAndLogin(username, role = 'viewer', homeLocationId = null) {
  await User.create({
    username,
    email: `${username}@test.com`,
    password: 'Test1234!',
    role,
    homeLocationId,
  });

  const user = await User.findOne({ where: { email: `${username}@test.com` } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });

  const authCookie = loginRes.headers['set-cookie']?.find((cookie) => cookie.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');

  return { token, id: user.id };
}

describe('Civic Questions API', () => {
  let creator;
  let voter;
  let outsider;
  let localLocation;
  let testQuestionId;

  const creatorCsrf = 'csrf-civic-creator';
  const voterCsrf = 'csrf-civic-voter';

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    localLocation = await Location.create({
      name: 'Test Municipality',
      type: 'municipality',
      slug: 'test-municipality',
    });

    creator = await registerAndLogin('civic_creator', 'viewer', localLocation.id);
    voter = await registerAndLogin('civic_voter', 'viewer', localLocation.id);
    outsider = await registerAndLogin('civic_outsider', 'viewer', null);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('rejects unauthenticated creation', async () => {
    const response = await request(app)
      .post('/api/civic-questions')
      .send({ title: 'Should fail', sourceType: 'parliament' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('creates civic question with authenticated user', async () => {
    const headers = csrfHeadersFor(creatorCsrf, creator.id);

    const response = await request(app)
      .post('/api/civic-questions')
      .set('Authorization', `Bearer ${creator.token}`)
      .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
      .set('x-csrf-token', creatorCsrf)
      .send({
        title: 'Should the municipality fund a new park?',
        sourceType: 'municipal_council',
        sourceName: 'Municipal Council',
        locationId: localLocation.id,
        voteRestriction: 'locals_only',
        visibility: 'public',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Should the municipality fund a new park?');
    expect(response.body.data.voteCounts).toEqual({ agree: 0, disagree: 0, present: 0 });

    testQuestionId = response.body.data.id;
  });

  test('requires a location for locals_only visibility', async () => {
    const headers = csrfHeadersFor('csrf-civic-local-visibility-create', creator.id);

    const response = await request(app)
      .post('/api/civic-questions')
      .set('Authorization', `Bearer ${creator.token}`)
      .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
      .set('x-csrf-token', 'csrf-civic-local-visibility-create')
      .send({
        title: 'Should local-only questions require a location?',
        sourceType: 'municipal_council',
        visibility: 'locals_only',
        voteRestriction: 'authenticated',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Location is required/);
  });

  test('rejects update that makes local visibility locationless', async () => {
    const headers = csrfHeadersFor('csrf-civic-local-visibility-update', creator.id);

    const response = await request(app)
      .put(`/api/civic-questions/${testQuestionId}`)
      .set('Authorization', `Bearer ${creator.token}`)
      .set('Cookie', [`auth_token=${creator.token}`, ...headers.Cookie])
      .set('x-csrf-token', 'csrf-civic-local-visibility-update')
      .send({
        visibility: 'locals_only',
        voteRestriction: 'authenticated',
        locationId: null,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Location is required/);
  });

  test('lists civic questions publicly', async () => {
    const response = await request(app).get('/api/civic-questions');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('supports list filters for sourceType, location, status, and category', async () => {
    const athens = await Location.create({
      name: 'Athens Center',
      type: 'municipality',
      slug: 'athens-center',
    });

    await CivicQuestion.create({
      title: 'Athens transport investment package',
      sourceType: 'parliament',
      sourceName: 'Parliament',
      category: 'Transport',
      status: 'open',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: athens.id,
      creatorId: creator.id,
    });

    await CivicQuestion.create({
      title: 'Regional budget revision',
      sourceType: 'regional_council',
      category: 'Economy',
      status: 'closed',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: localLocation.id,
      creatorId: creator.id,
    });

    const response = await request(app)
      .get('/api/civic-questions')
      .query({
        sourceType: 'parliament',
        status: 'open',
        category: 'Trans',
        location: 'Athens',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('Athens transport investment package');
  });

  test('sorts by closing soon', async () => {
    const now = Date.now();
    const soonQuestion = await CivicQuestion.create({
      title: 'Closing soon civic question',
      sourceType: 'municipal_council',
      category: 'phase2-closing-sort',
      status: 'open',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: localLocation.id,
      creatorId: creator.id,
      deadline: new Date(now + 60 * 60 * 1000),
    });

    const laterQuestion = await CivicQuestion.create({
      title: 'Closing later civic question',
      sourceType: 'municipal_council',
      category: 'phase2-closing-sort',
      status: 'open',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: localLocation.id,
      creatorId: creator.id,
      deadline: new Date(now + 4 * 24 * 60 * 60 * 1000),
    });

    const response = await request(app)
      .get('/api/civic-questions')
      .query({
        category: 'phase2-closing-sort',
        sortBy: 'closing_soon',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].id).toBe(soonQuestion.id);
    expect(response.body.data[1].id).toBe(laterQuestion.id);
  });

  test('sorts by most voted', async () => {
    const moreVoted = await CivicQuestion.create({
      title: 'Most voted question',
      sourceType: 'parliament',
      category: 'phase2-most-voted-sort',
      status: 'open',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: localLocation.id,
      creatorId: creator.id,
    });

    const lessVoted = await CivicQuestion.create({
      title: 'Less voted question',
      sourceType: 'parliament',
      category: 'phase2-most-voted-sort',
      status: 'open',
      visibility: 'public',
      voteRestriction: 'authenticated',
      locationId: localLocation.id,
      creatorId: creator.id,
    });

    await CivicQuestionVote.bulkCreate([
      { civicQuestionId: moreVoted.id, userId: creator.id, choice: 'agree' },
      { civicQuestionId: moreVoted.id, userId: voter.id, choice: 'agree' },
      { civicQuestionId: lessVoted.id, userId: creator.id, choice: 'present' },
    ]);

    const response = await request(app)
      .get('/api/civic-questions')
      .query({
        category: 'phase2-most-voted-sort',
        sortBy: 'most_voted',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].id).toBe(moreVoted.id);
    expect(response.body.data[0].totalVotes).toBeGreaterThan(response.body.data[1].totalVotes);
  });

  test('rejects invalid sort parameter', async () => {
    const response = await request(app)
      .get('/api/civic-questions')
      .query({ sortBy: 'random' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('records vote and supports changing vote', async () => {
    const headers = csrfHeadersFor(voterCsrf, voter.id);

    const firstVote = await request(app)
      .post(`/api/civic-questions/${testQuestionId}/vote`)
      .set('Authorization', `Bearer ${voter.token}`)
      .set('Cookie', [`auth_token=${voter.token}`, ...headers.Cookie])
      .set('x-csrf-token', voterCsrf)
      .send({ choice: 'agree' });

    expect(firstVote.status).toBe(200);
    expect(firstVote.body.success).toBe(true);
    expect(firstVote.body.data.myVote).toBe('agree');
    expect(firstVote.body.data.voteCounts.agree).toBe(1);

    const secondVote = await request(app)
      .post(`/api/civic-questions/${testQuestionId}/vote`)
      .set('Authorization', `Bearer ${voter.token}`)
      .set('Cookie', [`auth_token=${voter.token}`, ...headers.Cookie])
      .set('x-csrf-token', voterCsrf)
      .send({ choice: 'present' });

    expect(secondVote.status).toBe(200);
    expect(secondVote.body.data.myVote).toBe('present');
    expect(secondVote.body.data.voteCounts.agree).toBe(0);
    expect(secondVote.body.data.voteCounts.present).toBe(1);

    const votesInDb = await CivicQuestionVote.findAll({ where: { civicQuestionId: testQuestionId, userId: voter.id } });
    expect(votesInDb).toHaveLength(1);
  });

  test('blocks locals_only vote for outsider without local scope', async () => {
    const headers = csrfHeadersFor('csrf-civic-outsider', outsider.id);

    const response = await request(app)
      .post(`/api/civic-questions/${testQuestionId}/vote`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .set('Cookie', [`auth_token=${outsider.token}`, ...headers.Cookie])
      .set('x-csrf-token', 'csrf-civic-outsider')
      .send({ choice: 'disagree' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('blocks voting when civic question is closed', async () => {
    await CivicQuestion.update({ status: 'closed' }, { where: { id: testQuestionId } });

    const headers = csrfHeadersFor(voterCsrf, voter.id);
    const response = await request(app)
      .post(`/api/civic-questions/${testQuestionId}/vote`)
      .set('Authorization', `Bearer ${voter.token}`)
      .set('Cookie', [`auth_token=${voter.token}`, ...headers.Cookie])
      .set('x-csrf-token', voterCsrf)
      .send({ choice: 'agree' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('returns results endpoint data', async () => {
    const response = await request(app)
      .get(`/api/civic-questions/${testQuestionId}/results`)
      .set('Authorization', `Bearer ${creator.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('voteCounts');
    expect(response.body.data.voteCounts).toHaveProperty('agree');
    expect(response.body.data.voteCounts).toHaveProperty('disagree');
    expect(response.body.data.voteCounts).toHaveProperty('present');
  });
});
