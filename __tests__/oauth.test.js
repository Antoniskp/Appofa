const request = require('supertest');
const { sequelize, User } = require('../src/models');
const { generateState, validateState, isOAuthConfigured } = require('../src/utils/oauthHelpers');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('OAuth Integration Tests', () => {
  let testUser;
  let testToken;

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
    await sequelize.sync({ force: true });

    // Create a test user
    testUser = await User.create({
      username: 'oauthtest',
      email: 'oauth@test.com',
      password: 'test123',
      role: 'viewer',
      firstName: 'OAuth',
      lastName: 'Test'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'oauth@test.com',
        password: 'test123'
      });

    const authCookie = loginResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    testToken = authCookie.split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('OAuth Helper Functions', () => {
    test('should generate and validate state token', () => {
      const state = generateState(testUser.id, 'link');
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);

      const validatedData = validateState(state);
      expect(validatedData).toBeDefined();
      expect(validatedData.userId).toBe(testUser.id);
      expect(validatedData.mode).toBe('link');
    });

    test('should invalidate expired or consumed state token', () => {
      const state = generateState(testUser.id, 'login');
      
      // First validation should succeed
      const firstValidation = validateState(state);
      expect(firstValidation).toBeDefined();

      // Second validation should fail (already consumed)
      const secondValidation = validateState(state);
      expect(secondValidation).toBeNull();
    });

    test('should return null for invalid state token', () => {
      const invalidState = 'invalid-state-token';
      const validatedData = validateState(invalidState);
      expect(validatedData).toBeNull();
    });

    test('should check OAuth configuration status', () => {
      // GitHub should be false if env vars not set in test
      const githubConfigured = isOAuthConfigured('github');
      expect(typeof githubConfigured).toBe('boolean');

      // Unknown provider should be false
      const unknownConfigured = isOAuthConfigured('unknown');
      expect(unknownConfigured).toBe(false);
    });
  });

  describe('OAuth API Endpoints', () => {
    test('should get OAuth configuration status', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('github');
      expect(response.body.data).toHaveProperty('google');
      expect(response.body.data).toHaveProperty('facebook');
    });

    test('should initiate GitHub OAuth flow', async () => {
      // This will fail if GitHub OAuth is not configured
      const response = await request(app)
        .get('/api/auth/github?mode=login');

      // Should return either authUrl or error about not configured
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.authUrl).toBeDefined();
        expect(response.body.data.authUrl).toContain('github.com');
      } else {
        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
      }
    });

    test('should handle unlinking GitHub when not linked', async () => {
      const csrfToken = 'csrf-oauth-unlink';
      setCsrfToken(csrfToken, testUser.id);
      const response = await request(app)
        .delete('/api/auth/github/unlink')
        .set('Authorization', `Bearer ${testToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not linked');
    });

    test('should require authentication for unlinking', async () => {
      const response = await request(app)
        .delete('/api/auth/github/unlink');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GitHub Account Linking', () => {
    test('should link GitHub account to user', async () => {
      // Simulate GitHub account linking
      await testUser.update({
        githubId: '12345678',
        githubAccessToken: 'test-token',
        avatar: 'https://github.com/avatar.png'
      });

      await testUser.reload();
      expect(testUser.githubId).toBe('12345678');
      expect(testUser.avatar).toBe('https://github.com/avatar.png');
    });

    test('should unlink GitHub account if password exists', async () => {
      // Ensure user has GitHub linked
      await testUser.update({
        githubId: '12345678',
        githubAccessToken: 'test-token'
      });

      const csrfToken = 'csrf-oauth-unlink-success';
      setCsrfToken(csrfToken, testUser.id);
      const response = await request(app)
        .delete('/api/auth/github/unlink')
        .set('Authorization', `Bearer ${testToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      await testUser.reload();
      expect(testUser.githubId).toBeNull();
      expect(testUser.githubAccessToken).toBeNull();
    });

    test('should prevent unlinking if no password set', async () => {
      // Create a user without password (OAuth-only)
      const oauthOnlyUser = await User.create({
        username: 'githubonly',
        email: 'githubonly@test.com',
        password: null,
        githubId: '87654321',
        githubAccessToken: 'oauth-token',
        role: 'viewer'
      });

      // Login would normally not work for OAuth-only users,
      // but for testing we'll create a token manually
      const jwt = require('jsonwebtoken');
      const oauthToken = jwt.sign(
        { 
          id: oauthOnlyUser.id, 
          username: oauthOnlyUser.username, 
          email: oauthOnlyUser.email,
          role: oauthOnlyUser.role 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        { expiresIn: '24h' }
      );

      const csrfToken = 'csrf-oauth-unlink-no-password';
      setCsrfToken(csrfToken, oauthOnlyUser.id);
      const response = await request(app)
        .delete('/api/auth/github/unlink')
        .set('Authorization', `Bearer ${oauthToken}`)
        .set(csrfHeaderFor(csrfToken));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('set a password');
    });
  });

  describe('User Model OAuth Fields', () => {
    test('should create user with OAuth fields', async () => {
      const githubUser = await User.create({
        username: 'githubuser',
        email: 'github@test.com',
        githubId: '11111111',
        githubAccessToken: 'github-token',
        avatar: 'https://avatars.githubusercontent.com/u/11111111',
        firstName: 'GitHub',
        lastName: 'User',
        role: 'viewer'
      });

      expect(githubUser.githubId).toBe('11111111');
      expect(githubUser.githubAccessToken).toBe('github-token');
      expect(githubUser.avatar).toBe('https://avatars.githubusercontent.com/u/11111111');
      // Password is not set for OAuth-only users
      expect(githubUser.password).toBeFalsy();
    });

    test('should enforce unique githubId constraint', async () => {
      await User.create({
        username: 'user1',
        email: 'user1@test.com',
        githubId: '99999999',
        role: 'viewer'
      });

      // Try to create another user with same githubId
      await expect(
        User.create({
          username: 'user2',
          email: 'user2@test.com',
          githubId: '99999999',
          role: 'viewer'
        })
      ).rejects.toThrow();
    });
  });
});
