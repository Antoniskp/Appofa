const request = require('supertest');
const { sequelize, User, Article, Poll, PollVote, Location, Comment } = require('../src/models');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.NODE_ENV = 'test';

const statsRoutes = require('../src/routes/statsRoutes');

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/stats', statsRoutes);

describe('GET /api/stats/community', () => {
  let user1Id, user2Id;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const user1 = await User.create({
      username: 'statsuser1',
      email: 'statsuser1@test.com',
      password: 'password123',
      role: 'editor'
    });
    user1Id = user1.id;

    const user2 = await User.create({
      username: 'statsuser2',
      email: 'statsuser2@test.com',
      password: 'password123',
      role: 'editor'
    });
    user2Id = user2.id;

    await Article.create({
      title: 'Test Article One',
      content: 'This is the content of test article one.',
      authorId: user1Id,
      status: 'published'
    });

    await Article.create({
      title: 'Test Article Two',
      content: 'This is the content of test article two.',
      authorId: user1Id,
      status: 'published'
    });

    await Poll.create({
      title: 'Test Poll One',
      creatorId: user2Id,
      status: 'active'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should return 200 with success: true and all expected fields', async () => {
    const response = await request(app)
      .get('/api/stats/community')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    const { data } = response.body;
    expect(typeof data.totalUsers).toBe('number');
    expect(typeof data.totalArticles).toBe('number');
    expect(typeof data.totalPolls).toBe('number');
    expect(typeof data.totalVotes).toBe('number');
    expect(typeof data.totalComments).toBe('number');
    expect(typeof data.totalLocations).toBe('number');
    expect(typeof data.activeUsers).toBe('number');
    expect(typeof data.areasNeedingModerators).toBe('number');
    expect(data.updatedAt).toBeDefined();
  });

  test('should correctly count totalArticles and totalPolls', async () => {
    const response = await request(app)
      .get('/api/stats/community')
      .expect(200);

    const { data } = response.body;
    expect(data.totalArticles).toBe(2);
    expect(data.totalPolls).toBe(1);
    expect(data.totalUsers).toBe(2);
  });

  test('should count activeUsers as distinct article authors and poll creators', async () => {
    const response = await request(app)
      .get('/api/stats/community')
      .expect(200);

    // user1 authored articles, user2 created a poll → 2 active users
    expect(response.body.data.activeUsers).toBe(2);
  });
});
