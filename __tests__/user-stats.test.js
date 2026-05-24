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
    await User.create({
      username: 'user1',
      email: 'user1@test.com',
      password: 'password123',
      role: 'viewer'
    });

    await User.create({
      username: 'user2',
      email: 'user2@test.com',
      password: 'password123',
      role: 'viewer'
    });

    await User.create({
      username: 'user3',
      email: 'user3@test.com',
      password: 'password123',
      role: 'editor'
    });

    await User.create({
      username: 'user4',
      email: 'user4@test.com',
      password: 'password123',
      role: 'admin'
    });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('GET /api/auth/users/public-stats', () => {
    test('should return total user count without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBe(4);
      expect(response.body.data.totalProfiles).toBe(4);
      expect(response.body.data.registeredUsers).toBeDefined();
      expect(response.body.data.claimFlowProfiles).toBeDefined();
      expect(response.body.data.unclaimedProfiles).toBeDefined();
      expect(response.body.data.publicUsers).toBeDefined();
      expect(response.body.data.hiddenUsers).toBeDefined();
      expect(response.body.data.registeredUsers).toBe(4);
      expect(response.body.data.claimFlowProfiles).toBe(0);
      expect(response.body.data.publicUsers).toBe(0);
      expect(response.body.data.hiddenUsers).toBe(0);
      expect(response.body.data.searchableUsers).toBe(4);
      expect(response.body.data.nonSearchableUsers).toBe(0);
      // Should not include activeUsers
      expect(response.body.data.activeUsers).toBeUndefined();
    });

    test('should return correct stats when no users exist', async () => {
      // Delete all users
      await User.destroy({ where: {} });

      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(0);
      expect(response.body.data.totalProfiles).toBe(0);
      expect(response.body.data.registeredUsers).toBe(0);
      expect(response.body.data.claimFlowProfiles).toBe(0);
      expect(response.body.data.unclaimedProfiles).toBe(0);
      expect(response.body.data.publicUsers).toBe(0);
      expect(response.body.data.hiddenUsers).toBe(0);
      expect(response.body.data.searchableUsers).toBe(0);
      expect(response.body.data.nonSearchableUsers).toBe(0);
    });

    test('should count all users regardless of role', async () => {
      // Restore users
      await sequelize.sync({ force: true });
      
      await User.create({
        username: 'viewer1',
        email: 'viewer1@test.com',
        password: 'password123',
        role: 'viewer',
        profileVisibility: 'registered'
      });

      await User.create({
        username: 'admin1',
        email: 'admin1@test.com',
        password: 'password123',
        role: 'admin',
        profileVisibility: 'hidden'
      });

      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(2);
      expect(response.body.data.totalProfiles).toBe(2);
      expect(response.body.data.registeredUsers).toBe(2);
      expect(response.body.data.claimFlowProfiles).toBe(0);
      expect(response.body.data.unclaimedProfiles).toBe(0);
      expect(response.body.data.publicUsers).toBe(0);
      expect(response.body.data.hiddenUsers).toBe(1);
      expect(response.body.data.searchableUsers).toBe(1);
      expect(response.body.data.nonSearchableUsers).toBe(1);
    });

    test('should classify real users vs claim-flow profiles using claimStatus semantics', async () => {
      await sequelize.sync({ force: true });

      await User.create({
        username: 'registered-visible',
        email: 'registered-visible@test.com',
        password: 'password123',
        role: 'viewer',
        profileVisibility: 'registered',
        claimStatus: null
      });

      await User.create({
        username: 'person-unclaimed',
        email: 'person-unclaimed@test.com',
        password: 'password123',
        role: 'viewer',
        profileVisibility: 'public',
        claimStatus: 'unclaimed'
      });

      await User.create({
        username: 'person-pending-hidden',
        email: 'person-pending-hidden@test.com',
        password: 'password123',
        role: 'viewer',
        profileVisibility: 'hidden',
        claimStatus: 'pending'
      });

      await User.create({
        username: 'person-claimed',
        email: 'person-claimed@test.com',
        password: 'password123',
        role: 'viewer',
        profileVisibility: 'registered',
        claimStatus: 'claimed'
      });

      const response = await request(app)
        .get('/api/auth/users/public-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(4);
      expect(response.body.data.totalProfiles).toBe(4);
      expect(response.body.data.registeredUsers).toBe(1);
      expect(response.body.data.claimFlowProfiles).toBe(3);
      expect(response.body.data.publicUsers).toBe(3);
      expect(response.body.data.unclaimedProfiles).toBe(1);
      expect(response.body.data.hiddenUsers).toBe(1);
      expect(response.body.data.searchableUsers).toBe(3);
      expect(response.body.data.nonSearchableUsers).toBe(1);
    });
  });
});
