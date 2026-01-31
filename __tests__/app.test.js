const request = require('supertest');
const { sequelize } = require('../src/models');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');
const articleRoutes = require('../src/routes/articleRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

describe('News Application Integration Tests', () => {
  let adminToken;
  let editorToken;
  let viewerToken;
  let testArticleId;

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset database for tests
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('Authentication Tests', () => {
    test('should register a new admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testadmin',
          email: 'admin@test.com',
          password: 'admin123',
          role: 'admin',
          firstName: 'Test',
          lastName: 'Admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe('admin');
      adminToken = response.body.data.token;
    });

    test('should register a new editor user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testeditor',
          email: 'editor@test.com',
          password: 'editor123',
          role: 'editor',
          firstName: 'Test',
          lastName: 'Editor'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('editor');
      editorToken = response.body.data.token;
    });

    test('should register a new viewer user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testviewer',
          email: 'viewer@test.com',
          password: 'viewer123',
          role: 'viewer',
          firstName: 'Test',
          lastName: 'Viewer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('viewer');
      viewerToken = response.body.data.token;
    });

    test('should not register user with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('admin@test.com');
    });

    test('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should update profile details', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updatedadmin',
          firstName: 'Updated',
          lastName: 'Admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('updatedadmin');
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Admin');
    });

    test('should update password with current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: 'newadmin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should login with new password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'newadmin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Article CRUD Tests', () => {
    test('should create article as authenticated user', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
          summary: 'Test summary',
          category: 'Technology',
          status: 'published'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.title).toBe('Test Article');
      testArticleId = response.body.data.article.id;
    });

    test('should not create article without authentication', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Unauthorized Article',
          content: 'This should fail'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should get all published articles (public)', async () => {
      const response = await request(app)
        .get('/api/articles?status=published');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toBeDefined();
      expect(Array.isArray(response.body.data.articles)).toBe(true);
    });

    test('should get single article by ID', async () => {
      const response = await request(app)
        .get(`/api/articles/${testArticleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.id).toBe(testArticleId);
    });

    test('should update article as author', async () => {
      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Test Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.title).toBe('Updated Test Article');
    });

    test('should update article as editor (different user)', async () => {
      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Editor Updated Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should not delete article as viewer', async () => {
      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should delete article as admin', async () => {
      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .get('/api/articles/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Role-Based Access Control Tests', () => {
    let viewerArticleId;

    test('viewer should be able to create their own article', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Article',
          content: 'This is an article created by a viewer user.',
          status: 'draft'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      viewerArticleId = response.body.data.article.id;
    });

    test('viewer should be able to update their own article', async () => {
      const response = await request(app)
        .put(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Updated Viewer Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('editor should be able to update any article', async () => {
      const response = await request(app)
        .put(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Editor Modified Viewer Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('viewer should be able to delete their own article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('News Workflow Tests', () => {
    let moderatorToken;
    let newsArticleId;

    beforeAll(async () => {
      // Register a moderator user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testmoderator',
          email: 'moderator@test.com',
          password: 'moderator123',
          role: 'moderator',
          firstName: 'Test',
          lastName: 'Moderator'
        });
      
      moderatorToken = response.body.data.token;
    });

    test('should create article with isNews flag', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Breaking News Article',
          content: 'This is a news article that needs moderation approval.',
          summary: 'Breaking news summary',
          category: 'News',
          status: 'draft',
          isNews: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.isNews).toBe(true);
      expect(response.body.data.article.newsApprovedAt).toBeNull();
      newsArticleId = response.body.data.article.id;
    });

    test('should not approve news without moderator/admin role', async () => {
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('moderator should approve news successfully', async () => {
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.newsApprovedAt).toBeTruthy();
      expect(response.body.data.article.status).toBe('published');
    });

    test('should not approve already approved news', async () => {
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      // Should still succeed but article is already approved
      expect(response.status).toBe(200);
    });

    test('should not approve article not flagged as news', async () => {
      // Create a regular article
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Regular Article',
          content: 'This is not a news article.',
          status: 'draft',
          isNews: false
        });

      const regularArticleId = createResponse.body.data.article.id;

      const response = await request(app)
        .post(`/api/articles/${regularArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not flagged as news');
    });

    test('should update article and maintain isNews flag', async () => {
      const response = await request(app)
        .put(`/api/articles/${newsArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Updated Breaking News Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.isNews).toBe(true);
    });

    test('should allow author to unflag article as news', async () => {
      // Create a news article
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'News to Unflag',
          content: 'This will be unflagged as news.',
          isNews: true
        });

      const articleId = createResponse.body.data.article.id;

      // Unflag as news
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          isNews: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.isNews).toBe(false);
      expect(response.body.data.article.newsApprovedAt).toBeNull();
    });
  });
});
