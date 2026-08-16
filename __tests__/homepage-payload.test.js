const request = require('supertest');
const express = require('express');
const { sequelize } = require('../src/models');
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
});
