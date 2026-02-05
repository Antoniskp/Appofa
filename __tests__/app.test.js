const request = require('supertest');
const { sequelize, User } = require('../src/models');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, frontendUrl, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const articleRoutes = require('../src/routes/articleRoutes');
const adminRoutes = require('../src/routes/adminRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);

describe('News Application Integration Tests', () => {
  let adminToken;
  let editorToken;
  let viewerToken;
  let moderatorToken;
  let testArticleId;
  let editorUserId;
  let moderatorUserId;
  let viewerUserId;
  let adminUserId;

  const csrfHeaderFor = (token) => ({
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token
  });

  const setCsrfToken = (token, userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(token, userId);
  };

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset database for tests

    await User.create({
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
    });
    const adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    adminUserId = adminUser?.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    const adminCookie = loginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    adminToken = adminCookie.split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  test('should enable schema sync in non-production environments', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const { shouldSyncSchema } = require('../src/index');
    expect(shouldSyncSchema()).toBe(true);
    process.env.NODE_ENV = originalEnv;
  });

  test('should disable schema sync in production environments', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { shouldSyncSchema } = require('../src/index');
    expect(shouldSyncSchema()).toBe(false);
    process.env.NODE_ENV = originalEnv;
  });

  describe('Security Headers Tests', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/articles');

      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toContain("frame-ancestors 'self'");
      expect(cspHeader).toContain(`connect-src 'self' ${frontendUrl}`);
      expect(cspHeader).toContain("img-src 'self' data:");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
    });
  });

  describe('Authentication Tests', () => {
    test('should register a new user with viewer role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testviewer',
          email: 'viewer@test.com',
          password: 'viewer123',
          firstName: 'Test',
          lastName: 'Viewer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const csrfCookie = response.headers['set-cookie'].find((cookie) => cookie.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
      expect(response.body.data.user.role).toBe('viewer');
      viewerUserId = response.body.data.user.id;
      const viewerCookie = response.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
      viewerToken = viewerCookie.split(';')[0].replace('auth_token=', '');
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
      expect(response.body.data.user.role).toBe('viewer');
      editorUserId = response.body.data.user.id;
    });

    test('admin should update editor role', async () => {
      const csrfToken = 'csrf-admin-role';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/auth/users/${editorUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({ role: 'editor' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('editor');
    });

    test('should login as editor with updated role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'editor@test.com',
          password: 'editor123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('editor');
      const editorCookie = response.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
      editorToken = editorCookie.split(';')[0].replace('auth_token=', '');
    });

    test('should register a new moderator user', async () => {
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('viewer');
      moderatorUserId = response.body.data.user.id;
    });

    test('admin should update moderator role', async () => {
      const csrfToken = 'csrf-admin-moderator-role';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/auth/users/${moderatorUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({ role: 'moderator' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('moderator');
    });

    test('should allow demoting last admin role', async () => {
      const csrfToken = 'csrf-admin-demote';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/auth/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({ role: 'viewer' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('viewer');
    });

    test('should reject invalid role updates', async () => {
      const csrfToken = 'csrf-admin-invalid-role';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/auth/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({ role: 'invalid-role' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role.');
    });

    test('should return 404 when updating unknown user role', async () => {
      const csrfToken = 'csrf-admin-unknown-role';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/users/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({ role: 'viewer' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found.');
    });

    test('should login as moderator with updated role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'moderator@test.com',
          password: 'moderator123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('moderator');
      const moderatorCookie = response.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
      moderatorToken = moderatorCookie.split(';')[0].replace('auth_token=', '');
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
      expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('auth_token=')]));
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

    test('should reject invalid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'not-an-email',
          password: '123'
        });

      expect(response.status).toBe(400);
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
      const csrfToken = 'csrf-admin-profile';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          username: 'updatedadmin',
          firstName: 'Updated',
          lastName: 'Admin',
          avatar: 'https://example.com/avatar.png',
          avatarColor: '#1d4ed8'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('updatedadmin');
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Admin');
      expect(response.body.data.user.avatar).toBe('https://example.com/avatar.png');
      expect(response.body.data.user.avatarColor).toBe('#1d4ed8');
    });

    test('should reject profile updates without CSRF token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'no-csrf-update'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid CSRF token.');
    });

    test('should reject invalid profile names', async () => {
      const csrfToken = 'csrf-admin-profile-invalid-names';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          firstName: 'A'.repeat(120),
          lastName: 'B'.repeat(120)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid avatar URL', async () => {
      const csrfToken = 'csrf-admin-avatar';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          avatar: 'not-a-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Avatar URL is malformed.');
    });

    test('should reject invalid avatar color format', async () => {
      const csrfToken = 'csrf-admin-color';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          avatarColor: 'blue'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Avatar color must be a valid hex color (#RGB or #RRGGBB).');
    });

    test('should clear avatar fields with null', async () => {
      const csrfToken = 'csrf-admin-clear';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          avatar: null,
          avatarColor: null
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.avatar).toBeNull();
      expect(response.body.data.user.avatarColor).toBeNull();
    });

    test('should update password with current password', async () => {
      const csrfToken = 'csrf-admin-password';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
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

    test('admin should fetch user stats', async () => {
      const response = await request(app)
        .get('/api/auth/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(4);
      expect(response.body.data.byRole.admin).toBe(1);
      expect(response.body.data.byRole.editor).toBe(1);
      expect(response.body.data.byRole.moderator).toBe(1);
      expect(response.body.data.byRole.viewer).toBe(1);
    });

    test('admin should fetch users list', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(4);
      expect(response.body.data.stats.total).toBe(4);
      const viewerUser = response.body.data.users.find((user) => user.id === viewerUserId);
      expect(viewerUser).toBeDefined();
    });
  });

  describe('Article CRUD Tests', () => {
    test('should create article as authenticated user', async () => {
      const tags = ['feature', 'release'];
      const csrfToken = 'csrf-admin-create-article';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
          summary: 'Test summary',
          category: 'Technology',
          status: 'published',
          tags
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.title).toBe('Test Article');
      expect(response.body.data.article.tags).toEqual(tags);
      expect(response.body.data.article.bannerImageUrl).toBe('/images/branding/news default.png');
      testArticleId = response.body.data.article.id;
    });

    test('should reject articles with invalid tags', async () => {
      const csrfToken = 'csrf-admin-invalid-tags';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Invalid Tags Article',
          content: 'This content is long enough to satisfy validation rules.',
          tags: 'not-an-array'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tags must be an array of strings.');
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

    test('should require authentication for author filter', async () => {
      const response = await request(app)
        .get(`/api/articles?authorId=${adminUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required.');
    });

    test('should reject invalid author ID filters', async () => {
      const response = await request(app)
        .get('/api/articles?authorId=not-a-number')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid author ID.');
    });

    test('should prevent non-admins from filtering other authors', async () => {
      const response = await request(app)
        .get(`/api/articles?authorId=${adminUserId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied.');
    });

    test('should get single article by ID', async () => {
      const response = await request(app)
        .get(`/api/articles/${testArticleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.id).toBe(testArticleId);
    });

    test('should update article as author', async () => {
      const csrfToken = 'csrf-admin-update-article';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Updated Test Article',
          tags: ['updated', 'news'],
          bannerImageUrl: 'https://example.com/banner.png'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.title).toBe('Updated Test Article');
      expect(response.body.data.article.tags).toEqual(['updated', 'news']);
      expect(response.body.data.article.bannerImageUrl).toBe('https://example.com/banner.png');
    });

    test('should reject invalid article status update', async () => {
      const csrfToken = 'csrf-admin-update-invalid-status';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          status: 'invalid-status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should update article as editor (different user)', async () => {
      const csrfToken = 'csrf-editor-update-article';
      setCsrfToken(csrfToken, editorUserId);
      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Editor Updated Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should not delete article as viewer', async () => {
      const csrfToken = 'csrf-viewer-delete';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should delete article as admin', async () => {
      const csrfToken = 'csrf-admin-delete';
      setCsrfToken(csrfToken, adminUserId);
      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrfToken));

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
      const csrfToken = 'csrf-viewer-create';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
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
      const csrfToken = 'csrf-viewer-update';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .put(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Updated Viewer Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('editor should be able to update any article', async () => {
      const csrfToken = 'csrf-editor-update';
      setCsrfToken(csrfToken, editorUserId);
      const response = await request(app)
        .put(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Editor Modified Viewer Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('viewer should be able to delete their own article', async () => {
      const csrfToken = 'csrf-viewer-delete-own';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .delete(`/api/articles/${viewerArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Admin Health Checks', () => {
    test('admin should fetch health status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.checks).toBeDefined();
    });

    test('should require authentication for health status', async () => {
      const response = await request(app)
        .get('/api/admin/health');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('viewer should not access health status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('News Workflow Tests', () => {
    let newsArticleId;

    test('should create article with isNews flag', async () => {
      const csrfToken = 'csrf-viewer-news';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
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
      const csrfToken = 'csrf-viewer-approve';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('moderator should approve news successfully', async () => {
      const csrfToken = 'csrf-moderator-approve';
      setCsrfToken(csrfToken, moderatorUserId);
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.newsApprovedAt).toBeTruthy();
      expect(response.body.data.article.status).toBe('published');
    });

    test('should return only approved news items', async () => {
      const csrfToken = 'csrf-viewer-news-unapproved';
      setCsrfToken(csrfToken, viewerUserId);
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Unapproved Published News',
          content: 'This news item should not appear in public listings.',
          summary: 'Unapproved news summary',
          status: 'published',
          isNews: true
        });

      const unapprovedNewsId = createResponse.body.data.article.id;

      const response = await request(app)
        .get('/api/articles?type=news');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const newsArticles = response.body.data.articles || [];
      const newsIds = newsArticles.map(article => article.id);
      expect(newsIds).toContain(newsArticleId);
      expect(newsIds).not.toContain(unapprovedNewsId);
      expect(newsArticles.every(article => article.newsApprovedAt)).toBe(true);
    });

    test('should not approve already approved news', async () => {
      const csrfToken = 'csrf-moderator-approve-repeat';
      setCsrfToken(csrfToken, moderatorUserId);
      const response = await request(app)
        .post(`/api/articles/${newsArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaderFor(csrfToken));

      // Should still succeed but article is already approved
      expect(response.status).toBe(200);
    });

    test('should not approve article not flagged as news', async () => {
      // Create a regular article
      const csrfToken = 'csrf-viewer-regular';
      setCsrfToken(csrfToken, viewerUserId);
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Regular Article',
          content: 'This is not a news article.',
          status: 'draft',
          isNews: false
        });

      const regularArticleId = createResponse.body.data.article.id;

      const csrfTokenApprove = 'csrf-moderator-regular-approve';
      setCsrfToken(csrfTokenApprove, moderatorUserId);
      const response = await request(app)
        .post(`/api/articles/${regularArticleId}/approve-news`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaderFor(csrfTokenApprove));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not flagged as news');
    });

    test('should update article and maintain isNews flag', async () => {
      const csrfToken = 'csrf-viewer-update-news';
      setCsrfToken(csrfToken, viewerUserId);
      const response = await request(app)
        .put(`/api/articles/${newsArticleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'Updated Breaking News Article'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.article.isNews).toBe(true);
    });

    test('should allow author to unflag article as news', async () => {
      // Create a news article
      const csrfToken = 'csrf-viewer-unflag';
      setCsrfToken(csrfToken, viewerUserId);
      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfToken))
        .send({
          title: 'News to Unflag',
          content: 'This will be unflagged as news.',
          isNews: true
        });

      const articleId = createResponse.body.data.article.id;

      // Unflag as news
      const csrfTokenUpdate = 'csrf-viewer-unflag-update';
      setCsrfToken(csrfTokenUpdate, viewerUserId);
      const response = await request(app)
        .put(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrfTokenUpdate))
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
