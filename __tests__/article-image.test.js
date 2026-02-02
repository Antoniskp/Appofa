const request = require('supertest');
const { sequelize, User, Article, Image } = require('../src/models');
const path = require('path');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');
const articleRoutes = require('../src/routes/articleRoutes');
const imageRoutes = require('../src/routes/imageRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/images', imageRoutes);

describe('Article-Image Integration Tests', () => {
  let userToken;
  let userId;
  let imageId;
  let articleId;

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset database for tests

    // Create a test user
    await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: 'test123',
      role: 'editor',
      firstName: 'Test',
      lastName: 'User'
    });

    const user = await User.findOne({ where: { email: 'test@test.com' } });
    userId = user?.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'test123'
      });

    userToken = loginResponse.body.data.token;

    // Create a test image
    const imageResponse = await request(app)
      .post('/api/images/external')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        url: 'https://example.com/test.jpg',
        title: 'Test Article Image',
        tags: ['article', 'test']
      });

    imageId = imageResponse.body.data.image.id;
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('Article Creation with Image', () => {
    test('should create article with intro image', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Article with Image',
          content: 'This is a test article with an intro image.',
          summary: 'Test summary',
          status: 'draft',
          introImageId: imageId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article).toBeDefined();
      expect(response.body.data.article.introImageId).toBe(imageId);
      expect(response.body.data.article.introImage).toBeDefined();
      expect(response.body.data.article.introImage.id).toBe(imageId);
      expect(response.body.data.article.introImage.url).toBe('https://example.com/test.jpg');

      articleId = response.body.data.article.id;
    });

    test('should create article without intro image', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Article without Image',
          content: 'This is a test article without an intro image.',
          status: 'draft'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.introImageId).toBeNull();
      expect(response.body.data.article.introImage).toBeNull();
    });

    test('should reject article with invalid introImageId', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Article',
          content: 'Test content',
          introImageId: 99999
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid introImageId');
    });
  });

  describe('Article Update with Image', () => {
    test('should update article to add intro image', async () => {
      // First create an article without image
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Article to Update',
          content: 'This is test content that meets the minimum length requirement.',
          status: 'draft'
        });

      const articleIdToUpdate = createResponse.body.data.article.id;

      // Now update it to add an image
      const response = await request(app)
        .put(`/api/articles/${articleIdToUpdate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          introImageId: imageId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.introImageId).toBe(imageId);
      expect(response.body.data.article.introImage).toBeDefined();
    });

    test('should update article to remove intro image', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          introImageId: null
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.introImageId).toBeNull();
      expect(response.body.data.article.introImage).toBeNull();
    });

    test('should update article to change intro image', async () => {
      // Create another image
      const imageResponse = await request(app)
        .post('/api/images/external')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'https://example.com/new-image.jpg',
          title: 'New Image'
        });

      const newImageId = imageResponse.body.data.image.id;

      // Update article with new image
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          introImageId: newImageId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.introImageId).toBe(newImageId);
      expect(response.body.data.article.introImage.id).toBe(newImageId);
    });

    test('should reject update with invalid introImageId', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          introImageId: 99999
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid introImageId');
    });
  });

  describe('Get Articles with Images', () => {
    test('should get all articles with intro images included', async () => {
      const response = await request(app)
        .get('/api/articles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toBeDefined();
      
      // Find an article with an image
      const articleWithImage = response.body.data.articles.find(
        a => a.introImageId !== null
      );
      
      if (articleWithImage) {
        expect(articleWithImage.introImage).toBeDefined();
        expect(articleWithImage.introImage.url).toBeDefined();
      }
    });

    test('should get single article with intro image', async () => {
      const response = await request(app)
        .get(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article).toBeDefined();
      
      // This article should have an image from the previous test
      if (response.body.data.article.introImageId) {
        expect(response.body.data.article.introImage).toBeDefined();
      }
    });
  });

  describe('Permission Tests', () => {
    test('should not allow using another user\'s image', async () => {
      // Create another user
      await User.create({
        username: 'otheruser',
        email: 'other@test.com',
        password: 'test123',
        role: 'viewer',
        firstName: 'Other',
        lastName: 'User'
      });

      // Login as other user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@test.com',
          password: 'test123'
        });

      const otherUserToken = loginResponse.body.data.token;

      // Try to create article using first user's image
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Unauthorized Image Use',
          content: 'Test content',
          introImageId: imageId
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });
});
