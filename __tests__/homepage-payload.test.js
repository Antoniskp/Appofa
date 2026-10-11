const request = require('supertest');
const express = require('express');
const { sequelize, User, Location, Suggestion, Poll, LocationLink, Tag, TaggableItem } = require('../src/models');
const articleService = require('../src/services/articleService');
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

  it('ranks and limits tags in the database, with deterministic ties and entity isolation', async () => {
    for (const [name, count] of [['alpha', 8], ['beta', 8], ['gamma', 6], ['delta', 5], ['epsilon', 4], ['zeta', 1]]) {
      const tag = await Tag.create({ name });
      await TaggableItem.bulkCreate(Array.from({ length: count }, (_, i) => ({ tagId: tag.id, entityType: 'article', entityId: i + 1 })));
      if (name === 'zeta') await TaggableItem.bulkCreate(Array.from({ length: 10 }, (_, i) => ({ tagId: tag.id, entityType: 'poll', entityId: i + 100 })));
    }
    const result = await request(app).get('/api/homepage?sections=tags');
    expect(result.body.data).toEqual({ tags: { article: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'], poll: ['zeta'], suggestion: [] } });
    expect(result.body.errors).toEqual({});
    expect(result.headers['cache-control']).toBe('private, no-store');
  });

  it('isolates a thrown failure and recovers only the requested section', async () => {
    const spy = jest.spyOn(articleService, 'getAllArticles').mockRejectedValueOnce(new Error('private database details'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await request(app).get('/api/homepage?sections=latestArticles,tags');
      expect(result.status).toBe(200);
      expect(result.body.errors).toEqual({ latestArticles: 'unavailable' });
      expect(result.body.data.tags.article).toHaveLength(5);
      expect(JSON.stringify(result.body)).not.toContain('private database details');
      spy.mockClear();
      const recovered = await request(app).get('/api/homepage?sections=latestArticles');
      expect(recovered.body.errors).toEqual({});
      expect(Object.keys(recovered.body.data)).toEqual(['latestArticles']);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally { spy.mockRestore(); log.mockRestore(); }
  });

  it('treats a failed service response as unavailable rather than an empty feed', async () => {
    const spy = jest.spyOn(articleService, 'getAllArticles').mockResolvedValueOnce({ success: false });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await request(app).get('/api/homepage?sections=videos');
      expect(result.body).toEqual({ success: true, data: {}, errors: { videos: 'unavailable' } });
    } finally { spy.mockRestore(); log.mockRestore(); }
  });

  it.each(['unknown', 'polls,unknown', '', 'polls,'])('rejects invalid sections %s', async sections => {
    expect((await request(app).get('/api/homepage').query({ sections })).status).toBe(400);
  });
});
