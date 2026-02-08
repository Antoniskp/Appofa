const request = require('supertest');
const { sequelize, User } = require('../src/models');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('User Statistics Tests', () => {
  beforeAll(async () => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key-for-jwt';
    
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset database for tests

    // Create test users
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

    // Active user (logged in 15 days ago)
    await User.create({
      username: 'activeuser1',
      email: 'active1@test.com',
      password: 'password123',
      role: 'viewer',
      lastLoginAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    });

    // Active user (logged in 29 days ago)
    await User.create({
      username: 'activeuser2',
      email: 'active2@test.com',
      password: 'password123',
      role: 'viewer',
      lastLoginAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    });

    // Inactive user (logged in 35 days ago)
    await User.create({
      username: 'inactiveuser1',
      email: 'inactive1@test.com',
      password: 'password123',
      role: 'viewer',
      lastLoginAt: fortyDaysAgo
    });

    // Never logged in user
    await User.create({
      username: 'neverloggedin',
      email: 'never@test.com',
      password: 'password123',
      role: 'viewer',
      lastLoginAt: null
    });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('GET /api/auth/users/public-stats', () => {
    test('should return user statistics without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBe(4);
      expect(response.body.data.activeUsers).toBe(2);
    });

    test('should return correct stats when no users exist', async () => {
      // Delete all users
      await User.destroy({ where: {} });

      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(0);
      expect(response.body.data.activeUsers).toBe(0);

      // Restore users for other tests
      await sequelize.sync({ force: true });
    });
  });

  describe('lastLoginAt tracking', () => {
    test('should update lastLoginAt on successful login', async () => {
      // Create a test user
      await User.create({
        username: 'logintest',
        email: 'logintest@test.com',
        password: 'password123',
        role: 'viewer',
        lastLoginAt: null
      });

      const beforeLogin = new Date();

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check that lastLoginAt was updated
      const user = await User.findOne({ where: { email: 'logintest@test.com' } });
      expect(user.lastLoginAt).toBeDefined();
      expect(user.lastLoginAt).not.toBeNull();
      
      const loginTime = new Date(user.lastLoginAt);
      expect(loginTime.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
      expect(loginTime.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    test('should not update lastLoginAt on failed login', async () => {
      // Create a test user
      await User.create({
        username: 'failedlogin',
        email: 'failedlogin@test.com',
        password: 'password123',
        role: 'viewer',
        lastLoginAt: null
      });

      // Try to login with wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'failedlogin@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Check that lastLoginAt was not updated
      const user = await User.findOne({ where: { email: 'failedlogin@test.com' } });
      expect(user.lastLoginAt).toBeNull();
    });
  });
});
