const request = require('supertest');
const express = require('express');
const { sequelize, User, Location, Suggestion, Poll, LocationLink } = require('../src/models');
const homepageRoutes = require('../src/routes/homepageRoutes');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-homepage-payload';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api/homepage', homepageRoutes);

describe('Homepage Payload API', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns a consolidated public homepage payload', async () => {
    const res = await request(app).get('/api/homepage');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      latestArticles: [],
      latestNews: [],
      videos: [],
      polls: [],
      suggestions: [],
      prefectures: [],
      tags: {
        article: [],
        suggestion: [],
        poll: [],
      },
      homepageSettings: {
        manifestSection: { enabled: true, audience: 'all' },
        featuredPoll: { enabled: false, audience: 'all', pollId: null },
      },
      featuredPoll: null,
      manifestData: [],
    });
  });

  it('filters an area and its descendants without exposing restricted proposals', async () => {
    const author = await User.create({ username: 'area-author', email: 'area@example.test', password: 'password123' });
    const area = await Location.create({ name: 'Test area', slug: 'test-area', type: 'prefecture' });
    const town = await Location.create({ name: 'Test town', slug: 'test-town', type: 'municipality', parent_id: area.id });
    const other = await Location.create({ name: 'Other town', slug: 'other-town', type: 'municipality' });
    const create = (locationId, visibility) => Suggestion.create({ title: 'Area proposal', body: 'A local issue.', authorId: author.id, locationId, visibility });
    const local = await create(town.id, 'public');
    await create(town.id, 'locals_only');
    await create(town.id, 'private');
    await create(other.id, 'public');
    const poll = await Poll.create({ title: 'Local consultation', creatorId: author.id, locationId: town.id });
    await LocationLink.create({ location_id: town.id, entity_type: 'poll', entity_id: poll.id });
    const result = await request(app).get(`/api/homepage?locationId=${area.id}`);
    expect(result.status).toBe(200);
    expect(result.body.data.suggestions.map(item => item.id)).toEqual([local.id]);
    expect(result.body.data.polls.map(item => item.id)).toContain(poll.id);
    const elsewhere = await request(app).get(`/api/homepage?locationId=${other.id}`);
    expect(elsewhere.body.data.polls).toEqual([]);
  });

  it.each(['-1', 'abc', '1.5'])('rejects invalid location %s', async locationId => {
    expect((await request(app).get('/api/homepage').query({ locationId })).status).toBe(400);
  });
});
