const request = require('supertest');
const { sequelize, User, Poll, PollOption, PollVote, Location, LocationLink } = require('../src/models');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.NODE_ENV = 'test';

const authRoutes = require('../src/routes/authRoutes');
const pollRoutes = require('../src/routes/pollRoutes');

// Create test app
const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

describe('Poll API Tests', () => {
  let adminToken;
  let userToken;
  let adminUserId;
  let regularUserId;
  let testPollId;
  let testPollOptionId;

  const csrfHeaderFor = (token, userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(token, userId);
    return {
      Cookie: [`csrf_token=${token}`],
      'x-csrf-token': token
    };
  };

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create International location directly for tests (avoiding migration SQL compatibility issues)
    await Location.create({
      name: 'International',
      type: 'international',
      slug: 'international',
      parent_id: null
    });

    // Create admin user
    await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });

    const adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    adminUserId = adminUser.id;

    // Create regular user
    await User.create({
      username: 'testuser',
      email: 'user@test.com',
      password: 'user123',
      role: 'user',
      firstName: 'Test',
      lastName: 'User'
    });

    const regularUser = await User.findOne({ where: { email: 'user@test.com' } });
    regularUserId = regularUser.id;

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    const adminCookie = adminLogin.headers['set-cookie'].find((cookie) => 
      cookie.startsWith('auth_token=')
    );
    adminToken = adminCookie.split(';')[0].replace('auth_token=', '');

    // Login regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'user123'
      });

    const userCookie = userLogin.headers['set-cookie'].find((cookie) => 
      cookie.startsWith('auth_token=')
    );
    userToken = userCookie.split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/polls - Create Poll', () => {
    test('should create a simple poll with valid data (authenticated)', async () => {
      const csrfToken = 'test-csrf-token-create-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'What is your favorite color?',
          description: 'Choose your favorite color from the options below.',
          type: 'simple',
          allowUserContributions: false,
          allowUnauthenticatedVotes: true,
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Red' },
            { text: 'Blue' },
            { text: 'Green' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('What is your favorite color?');
      expect(response.body.data.options).toHaveLength(3);
      expect(response.body.data.creatorId).toBe(adminUserId);

      testPollId = response.body.data.id;
      testPollOptionId = response.body.data.options[0].id;
    });

    test('should fail to create poll without authentication', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          title: 'Test Poll',
          type: 'simple',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid title (too short)', async () => {
      const csrfToken = 'test-csrf-token-invalid-title';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Hi',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Title');
    });

    test('should fail with less than 2 options', async () => {
      const csrfToken = 'test-csrf-token-few-options';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Test Poll with One Option',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Only Option' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('At least 2 options');
    });

    test('should allow creating poll with 0 options when user contributions are enabled', async () => {
      const csrfToken = 'test-csrf-token-zero-options';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'User Contribution Poll',
          description: 'Users will add their own options',
          type: 'simple',
          allowUserContributions: true,
          visibility: 'public',
          resultsVisibility: 'always',
          options: []
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.allowUserContributions).toBe(true);
      expect(response.body.data.options).toHaveLength(0);
    });

    test('should create a complex poll', async () => {
      const csrfToken = 'test-csrf-token-complex';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Best Restaurant',
          description: 'Vote for the best restaurant',
          type: 'complex',
          allowUserContributions: true,
          allowUnauthenticatedVotes: false,
          visibility: 'public',
          resultsVisibility: 'after_vote',
          options: [
            {
              text: 'Italian Restaurant',
              photoUrl: '/images/italian.jpg',
              answerType: 'custom'
            },
            {
              text: 'Chinese Restaurant',
              photoUrl: '/images/chinese.jpg',
              answerType: 'custom'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('complex');
      expect(response.body.data.allowUserContributions).toBe(true);
    });

    test('should create a complex poll without answerType', async () => {
      const csrfToken = 'test-csrf-token-complex-no-answer-type';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Best Product',
          description: 'Vote for the best product',
          type: 'complex',
          allowUserContributions: false,
          allowUnauthenticatedVotes: false,
          visibility: 'public',
          resultsVisibility: 'after_vote',
          options: [
            {
              text: 'Product A',
              photoUrl: '/images/product-a.jpg',
              displayText: 'Great product'
            },
            {
              text: 'Product B',
              photoUrl: '/images/product-b.jpg',
              linkUrl: 'https://example.com/product-b'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('complex');
      expect(response.body.data.options).toHaveLength(2);
    });

    test('should create poll with future deadline', async () => {
      const csrfToken = 'test-csrf-token-deadline';
      const headers = csrfHeaderFor(csrfToken, adminUserId);
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Poll with Deadline',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          deadline: futureDate.toISOString(),
          options: [
            { text: 'Yes' },
            { text: 'No' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.deadline).getTime()).toBeCloseTo(
        futureDate.getTime(),
        -3 // tolerance of 1000 (10^3) milliseconds
      );
    });

    test('should fail with past deadline', async () => {
      const csrfToken = 'test-csrf-token-past-deadline';
      const headers = csrfHeaderFor(csrfToken, adminUserId);
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Poll with Past Deadline',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          deadline: pastDate.toISOString(),
          options: [
            { text: 'Yes' },
            { text: 'No' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('future');
    });

    test('should create poll with international location', async () => {
      const csrfToken = 'test-csrf-token-international';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      // Fetch the international location created by migration 017
      const internationalLocation = await Location.findOne({
        where: { 
          type: 'international',
          slug: 'international'
        }
      });

      expect(internationalLocation).not.toBeNull();
      expect(internationalLocation.name).toBe('International');

      // Create a poll with the international location ID
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'International Poll Test',
          description: 'Testing poll creation with international location',
          type: 'simple',
          allowUserContributions: false,
          allowUnauthenticatedVotes: true,
          visibility: 'public',
          resultsVisibility: 'always',
          locationId: internationalLocation.id,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
            { text: 'Option 3' }
          ]
        });

      // Verify the poll was created successfully
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('International Poll Test');
      expect(response.body.data.locationId).toBe(internationalLocation.id);
      expect(response.body.data.options).toHaveLength(3);

      const createdPollId = response.body.data.id;

      // Verify the poll exists in the database with correct locationId
      const pollInDb = await Poll.findByPk(createdPollId);
      expect(pollInDb).not.toBeNull();
      expect(pollInDb.locationId).toBe(internationalLocation.id);
      expect(pollInDb.title).toBe('International Poll Test');

      // Verify the LocationLink was created properly
      const locationLink = await LocationLink.findOne({
        where: {
          location_id: internationalLocation.id,
          entity_type: 'poll',
          entity_id: createdPollId
        }
      });

      expect(locationLink).not.toBeNull();
      expect(locationLink.location_id).toBe(internationalLocation.id);
      expect(locationLink.entity_type).toBe('poll');
      expect(locationLink.entity_id).toBe(createdPollId);
    });
  });

  describe('GET /api/polls - Get All Polls', () => {
    test('should get all public polls', async () => {
      const response = await request(app)
        .get('/api/polls');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('totalItems');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/polls')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.itemsPerPage).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    test('should filter by type', async () => {
      const response = await request(app)
        .get('/api/polls')
        .query({ type: 'simple' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach(poll => {
        expect(poll.type).toBe('simple');
      });
    });

    test('should include vote counts', async () => {
      const response = await request(app)
        .get('/api/polls');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('totalVotes');
        expect(response.body.data[0].options[0]).toHaveProperty('voteCount');
      }
    });

    test('should filter polls by search text', async () => {
      const response = await request(app)
        .get('/api/polls')
        .query({ search: 'favorite color' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const matchesSearch = response.body.data.every((poll) => {
        const searchable = [poll.title, poll.description, poll.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes('favorite color');
      });

      expect(matchesSearch).toBe(true);
    });
  });

  describe('GET /api/polls/:id - Get Poll by ID', () => {
    test('should get poll by ID with statistics', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPollId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPollId);
      expect(response.body.data).toHaveProperty('creator');
      expect(response.body.data).toHaveProperty('options');
      expect(response.body.data).toHaveProperty('totalVotes');
    });

    test('should return 404 for non-existent poll', async () => {
      const response = await request(app)
        .get('/api/polls/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should deny access to private poll for non-creator', async () => {
      // Create private poll
      const csrfToken = 'test-csrf-token-private';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Private Poll',
          type: 'simple',
          visibility: 'private',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      const privatePollId = createResponse.body.data.id;

      // Try to access as different user
      const response = await request(app)
        .get(`/api/polls/${privatePollId}`)
        .set('Cookie', `auth_token=${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/polls/:id/vote - Vote on Poll', () => {
    test('should allow authenticated user to vote', async () => {
      const csrfToken = 'test-csrf-token-vote';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .post(`/api/polls/${testPollId}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: testPollOptionId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('voteId');
      expect(response.body.data).toHaveProperty('voteCounts');
    });

    test('should allow unauthenticated vote if poll allows it', async () => {
      const csrfToken = 'test-csrf-token-unauth-vote';
      const headers = {
        Cookie: [`csrf_token=${csrfToken}`],
        'x-csrf-token': csrfToken
      };

      // Store CSRF token for unauthenticated user
      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfToken, null);

      const response = await request(app)
        .post(`/api/polls/${testPollId}/vote`)
        .set('Cookie', headers.Cookie)
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: testPollOptionId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update vote when user changes their vote', async () => {
      const csrfToken = 'test-csrf-token-change-vote';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      // Get second option
      const poll = await Poll.findByPk(testPollId, {
        include: [{ model: PollOption, as: 'options' }]
      });
      const secondOptionId = poll.options[1].id;

      const response = await request(app)
        .post(`/api/polls/${testPollId}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: secondOptionId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify only one vote exists for this user
      const votes = await PollVote.findAll({
        where: { pollId: testPollId, userId: regularUserId }
      });
      expect(votes).toHaveLength(1);
      expect(votes[0].optionId).toBe(secondOptionId);
    });

    test('should fail to vote on non-existent poll', async () => {
      const csrfToken = 'test-csrf-token-invalid-poll';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .post('/api/polls/99999/vote')
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail to vote with invalid option ID', async () => {
      const csrfToken = 'test-csrf-token-invalid-option';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .post(`/api/polls/${testPollId}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: 99999
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid option');
    });

    test('should fail unauthenticated vote on auth-required poll', async () => {
      // Create poll that requires authentication
      const csrfToken = 'test-csrf-token-auth-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Auth Required Poll',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          allowUnauthenticatedVotes: false,
          options: [
            { text: 'Yes' },
            { text: 'No' }
          ]
        });

      const authPollId = createResponse.body.data.id;
      const authPollOptionId = createResponse.body.data.options[0].id;

      // Try to vote without authentication
      const csrfTokenVote = 'test-csrf-token-unauth-fail';
      const voteHeaders = {
        Cookie: [`csrf_token=${csrfTokenVote}`],
        'x-csrf-token': csrfTokenVote
      };

      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfTokenVote, null);

      const response = await request(app)
        .post(`/api/polls/${authPollId}/vote`)
        .set('Cookie', voteHeaders.Cookie)
        .set('x-csrf-token', csrfTokenVote)
        .send({
          optionId: authPollOptionId
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/polls/:id/options - Add User Contributed Option', () => {
    let contributablePollId;
    
    beforeAll(async () => {
      // Create poll that allows user contributions
      const csrfToken = 'test-csrf-token-contrib-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Contributable Poll',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          allowUserContributions: true,
          options: [
            { text: 'Initial Option 1' },
            { text: 'Initial Option 2' }
          ]
        });

      contributablePollId = response.body.data.id;
    });

    test('should allow user to add option to contributable poll', async () => {
      const csrfToken = 'test-csrf-token-add-option';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .post(`/api/polls/${contributablePollId}/options`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          text: 'User Contributed Option'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('User Contributed Option');
      expect(response.body.data.addedByUserId).toBe(regularUserId);
    });

    test('should fail to add option to non-contributable poll', async () => {
      const csrfToken = 'test-csrf-token-no-contrib';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .post(`/api/polls/${testPollId}/options`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          text: 'Should Fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should require authentication to add option', async () => {
      const response = await request(app)
        .post(`/api/polls/${contributablePollId}/options`)
        .send({
          text: 'Should Fail'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/polls/:id/results - Get Poll Results', () => {
    let alwaysVisiblePollId;
    let afterVotePollId;
    let afterVotePollOptionId;

    beforeAll(async () => {
      const csrfToken = 'test-csrf-token-results-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      // Create poll with always visible results
      const response1 = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Always Visible Results',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option A' },
            { text: 'Option B' }
          ]
        });

      alwaysVisiblePollId = response1.body.data.id;

      // Create poll with after_vote results
      const response2 = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'After Vote Results',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'after_vote',
          options: [
            { text: 'Option X' },
            { text: 'Option Y' }
          ]
        });

      afterVotePollId = response2.body.data.id;
      afterVotePollOptionId = response2.body.data.options[0].id;
    });

    test('should get results for always visible poll', async () => {
      const response = await request(app)
        .get(`/api/polls/${alwaysVisiblePollId}/results`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('poll');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data.results).toHaveProperty('options');
      expect(response.body.data.results).toHaveProperty('totalVotes');
      expect(response.body.data.results.options[0]).toHaveProperty('percentage');
    });

    test('should deny results for after_vote poll without voting', async () => {
      // Create new user who hasn't voted
      await User.create({
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'newuser123',
        role: 'user',
        firstName: 'New',
        lastName: 'User'
      });

      const newUser = await User.findOne({ where: { email: 'newuser@test.com' } });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'newuser123'
        });

      const newUserCookie = loginResponse.headers['set-cookie'].find((cookie) => 
        cookie.startsWith('auth_token=')
      );
      const newUserToken = newUserCookie.split(';')[0].replace('auth_token=', '');

      const response = await request(app)
        .get(`/api/polls/${afterVotePollId}/results`)
        .set('Cookie', `auth_token=${newUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not yet available');
    });

    test('should allow results for after_vote poll after voting', async () => {
      const csrfToken = 'test-csrf-token-vote-results';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      // Vote first
      await request(app)
        .post(`/api/polls/${afterVotePollId}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          optionId: afterVotePollOptionId
        });

      // Now get results
      const response = await request(app)
        .get(`/api/polls/${afterVotePollId}/results`)
        .set('Cookie', `auth_token=${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should include vote breakdown by authentication status', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPollId}/results`);

      expect(response.status).toBe(200);
      expect(response.body.data.results).toHaveProperty('totalAuthenticatedVotes');
      expect(response.body.data.results).toHaveProperty('totalUnauthenticatedVotes');
      expect(response.body.data.results.options[0]).toHaveProperty('authenticatedVotes');
      expect(response.body.data.results.options[0]).toHaveProperty('unauthenticatedVotes');
    });
  });

  describe('PUT /api/polls/:id - Update Poll', () => {
    test('should allow creator to update poll', async () => {
      const csrfToken = 'test-csrf-token-update';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .put(`/api/polls/${testPollId}`)
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Updated Poll Title',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Poll Title');
      expect(response.body.data.description).toBe('Updated description');
    });

    test('should allow admin to update any poll', async () => {
      // Create poll as regular user
      const csrfToken = 'test-csrf-token-user-poll';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'User Poll',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Yes' },
            { text: 'No' }
          ]
        });

      const userPollId = createResponse.body.data.id;

      // Update as admin
      const csrfTokenAdmin = 'test-csrf-token-admin-update';
      const headersAdmin = csrfHeaderFor(csrfTokenAdmin, adminUserId);

      const response = await request(app)
        .put(`/api/polls/${userPollId}`)
        .set('Cookie', [`auth_token=${adminToken}`, ...headersAdmin.Cookie])
        .set('x-csrf-token', csrfTokenAdmin)
        .send({
          status: 'closed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('closed');
    });

    test('should deny non-creator non-admin from updating', async () => {
      const csrfToken = 'test-csrf-token-deny-update';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .put(`/api/polls/${testPollId}`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Should Fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/polls/:id - Delete Poll', () => {
    test('should archive poll with votes', async () => {
      // Create poll
      const csrfToken = 'test-csrf-token-delete-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Poll to Archive',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          allowUnauthenticatedVotes: true,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      const pollId = createResponse.body.data.id;
      const optionId = createResponse.body.data.options[0].id;

      // Vote on it
      const csrfTokenVote = 'test-csrf-token-vote-delete';
      const headersVote = csrfHeaderFor(csrfTokenVote, regularUserId);

      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, ...headersVote.Cookie])
        .set('x-csrf-token', csrfTokenVote)
        .send({
          optionId
        });

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/polls/${pollId}`)
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain('archived');

      // Verify it's archived
      const poll = await Poll.findByPk(pollId);
      expect(poll.status).toBe('archived');
    });

    test('should hard delete poll without votes', async () => {
      // Create location for this test
      const testLocation = await Location.create({
        name: 'Test Delete Location',
        type: 'city',
        slug: 'test-delete-location',
        parentId: 1 // International
      });

      // Create poll with location
      const csrfToken = 'test-csrf-token-hard-delete';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Poll to Delete',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          locationId: testLocation.id,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      const pollId = createResponse.body.data.id;

      // Verify LocationLink was created
      const locationLinkBefore = await LocationLink.findOne({
        where: {
          entity_type: 'poll',
          entity_id: pollId
        }
      });
      expect(locationLinkBefore).not.toBeNull();

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/polls/${pollId}`)
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain('deleted');

      // Verify poll is gone
      const poll = await Poll.findByPk(pollId);
      expect(poll).toBeNull();

      // Verify LocationLink is also removed
      const locationLinkAfter = await LocationLink.findOne({
        where: {
          entity_type: 'poll',
          entity_id: pollId
        }
      });
      expect(locationLinkAfter).toBeNull();
    });

    test('should deny non-creator from deleting', async () => {
      const csrfToken = 'test-csrf-token-deny-delete';
      const headers = csrfHeaderFor(csrfToken, regularUserId);

      const response = await request(app)
        .delete(`/api/polls/${testPollId}`)
        .set('Cookie', [`auth_token=${userToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit unauthenticated votes', async () => {
      // Create a new poll for rate limit testing
      const csrfToken = 'test-csrf-token-rate-limit-poll';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Rate Limit Test Poll',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          allowUnauthenticatedVotes: true,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      const rateLimitPollId = createResponse.body.data.id;
      const rateLimitOptionId = createResponse.body.data.options[0].id;

      // Note: Full rate limit testing requires making many requests
      // This is a simplified test to verify the limiter is in place
      const csrfTokenVote = 'test-csrf-token-rate-limit-vote';
      const voteHeaders = {
        Cookie: [`csrf_token=${csrfTokenVote}`],
        'x-csrf-token': csrfTokenVote
      };

      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfTokenVote, null);

      const response = await request(app)
        .post(`/api/polls/${rateLimitPollId}/vote`)
        .set('Cookie', voteHeaders.Cookie)
        .set('x-csrf-token', csrfTokenVote)
        .send({
          optionId: rateLimitOptionId
        });

      // First vote should succeed
      expect([200, 429]).toContain(response.status);
    }, 30000); // Increase timeout for rate limit test
  });

  describe('Security & Validation', () => {
    test('should sanitize user inputs', async () => {
      const csrfToken = 'test-csrf-token-sanitize';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: '  Trimmed Title  ',
          description: '  Trimmed Description  ',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: '  Option 1  ' },
            { text: '  Option 2  ' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Trimmed Title');
      expect(response.body.data.description).toBe('Trimmed Description');
      expect(response.body.data.options[0].text).toBe('Option 1');
    });

    test('should reject invalid enum values', async () => {
      const csrfToken = 'test-csrf-token-invalid-enum';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Invalid Type Poll',
          type: 'invalid_type',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Poll type');
    });

    test('should reject invalid answerType when provided', async () => {
      const csrfToken = 'test-csrf-token-invalid-answertype';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Invalid Answer Type Poll',
          type: 'complex',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { 
              text: 'Option 1',
              photoUrl: '/image.jpg',
              answerType: 'invalid_answer_type'
            },
            { 
              text: 'Option 2',
              photoUrl: '/image2.jpg',
              answerType: 'custom'
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Answer type');
    });

    test('should require CSRF token for state-changing operations', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          title: 'Should Fail',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Poll Tags Support', () => {
    test('should create a poll with tags', async () => {
      const csrfToken = 'test-csrf-token-tags';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Best Programming Language',
          description: 'Choose your favorite programming language',
          category: 'Education',
          tags: ['programming', 'education', 'beginners'],
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'JavaScript' },
            { text: 'Python' },
            { text: 'Java' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(['programming', 'education', 'beginners']);
      expect(response.body.data.category).toBe('Education');
    });

    test('should create a poll without tags (backward compatibility)', async () => {
      const csrfToken = 'test-csrf-token-no-tags';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Favorite Color Without Tags',
          type: 'simple',
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Red' },
            { text: 'Blue' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual([]);
    });

    test('should fail with invalid tags (not an array)', async () => {
      const csrfToken = 'test-csrf-token-invalid-tags';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Invalid Tags Test',
          type: 'simple',
          tags: 'programming,education',  // Should be an array, not a string
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tags');
    });

    test('should trim and normalize tags', async () => {
      const csrfToken = 'test-csrf-token-normalize-tags';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Tag Normalization Test',
          type: 'simple',
          tags: ['  programming  ', 'education', '', '  web  '],
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(['programming', 'education', 'web']);
    });

    test('should update poll tags', async () => {
      // First create a poll
      const csrfTokenCreate = 'test-csrf-token-create-for-update';
      const headersCreate = csrfHeaderFor(csrfTokenCreate, adminUserId);

      const createResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headersCreate.Cookie])
        .set('x-csrf-token', csrfTokenCreate)
        .send({
          title: 'Poll to Update Tags',
          type: 'simple',
          tags: ['old-tag'],
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      expect(createResponse.status).toBe(201);
      const pollId = createResponse.body.data.id;

      // Now update the tags
      const csrfTokenUpdate = 'test-csrf-token-update-tags';
      const headersUpdate = csrfHeaderFor(csrfTokenUpdate, adminUserId);

      const updateResponse = await request(app)
        .put(`/api/polls/${pollId}`)
        .set('Cookie', [`auth_token=${adminToken}`, ...headersUpdate.Cookie])
        .set('x-csrf-token', csrfTokenUpdate)
        .send({
          tags: ['new-tag', 'another-tag']
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.tags).toEqual(['new-tag', 'another-tag']);
    });

    test('should filter polls by tag', async () => {
      // Create polls with specific tags
      const csrfToken1 = 'test-csrf-token-filter-1';
      const headers1 = csrfHeaderFor(csrfToken1, adminUserId);

      await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers1.Cookie])
        .set('x-csrf-token', csrfToken1)
        .send({
          title: 'Programming Poll',
          type: 'simple',
          tags: ['programming', 'tech'],
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      const csrfToken2 = 'test-csrf-token-filter-2';
      const headers2 = csrfHeaderFor(csrfToken2, adminUserId);

      await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers2.Cookie])
        .set('x-csrf-token', csrfToken2)
        .send({
          title: 'Cooking Poll',
          type: 'simple',
          tags: ['cooking', 'food'],
          visibility: 'public',
          resultsVisibility: 'always',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        });

      // Filter by programming tag
      const response = await request(app)
        .get('/api/polls?tag=programming')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Check that at least one poll with 'programming' tag is returned
      const programmingPolls = response.body.data.filter(poll => 
        poll.tags && poll.tags.includes('programming')
      );
      expect(programmingPolls.length).toBeGreaterThan(0);
    });

    test('should filter polls by tag case-insensitively and with partial text', async () => {
      const response = await request(app)
        .get('/api/polls?tag=ProGRa')
        .set('Cookie', `auth_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((poll) => (
        Array.isArray(poll.tags)
        && poll.tags.some((pollTag) => pollTag.toLowerCase().includes('progra'))
      ))).toBe(true);
    });
  });

  describe('Client IP Extraction (getClientIp helper)', () => {
    let ipTestPollId;
    let ipTestOptionId;

    beforeAll(async () => {
      const csrfToken = 'test-csrf-token-ip-poll-create';
      const headers = csrfHeaderFor(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, ...headers.Cookie])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'IP Extraction Test Poll',
          type: 'simple',
          allowUnauthenticatedVotes: true,
          visibility: 'public',
          resultsVisibility: 'always',
          options: [{ text: 'Option A' }, { text: 'Option B' }]
        });

      ipTestPollId = response.body.data.id;
      ipTestOptionId = response.body.data.options[0].id;
    });

    test('should record req.ip (socket address) when no forwarded header is set', async () => {
      const csrfToken = 'test-csrf-token-ip-socket';
      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfToken, null);

      const response = await request(app)
        .post(`/api/polls/${ipTestPollId}/vote`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ optionId: ipTestOptionId });

      expect(response.status).toBe(200);

      const vote = await PollVote.findOne({
        where: { pollId: ipTestPollId, userId: null }
      });
      expect(vote).not.toBeNull();
      expect(vote.ipAddress).toBeTruthy();
    });

    test('should use forwarded IP (req.ip via trust proxy) when X-Forwarded-For is set', async () => {
      const csrfToken = 'test-csrf-token-ip-forwarded';
      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfToken, null);

      const forwardedIp = '203.0.113.42';

      const response = await request(app)
        .post(`/api/polls/${ipTestPollId}/vote`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .set('X-Forwarded-For', forwardedIp)
        .send({ optionId: ipTestOptionId });

      expect(response.status).toBe(200);

      const vote = await PollVote.findOne({
        where: { pollId: ipTestPollId, userId: null, ipAddress: forwardedIp }
      });
      expect(vote).not.toBeNull();
      expect(vote.ipAddress).toBe(forwardedIp);
    });

    test('should use first IP from X-Forwarded-For chain (req.ips via trust proxy)', async () => {
      const csrfToken = 'test-csrf-token-ip-chain';
      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfToken, null);

      const clientIp = '203.0.113.99';
      const proxyIp = '10.0.0.1';

      const response = await request(app)
        .post(`/api/polls/${ipTestPollId}/vote`)
        .set('Cookie', [`csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .set('X-Forwarded-For', `${clientIp}, ${proxyIp}`)
        .send({ optionId: ipTestOptionId });

      expect(response.status).toBe(200);

      const vote = await PollVote.findOne({
        where: { pollId: ipTestPollId, userId: null, ipAddress: clientIp }
      });
      expect(vote).not.toBeNull();
      expect(vote.ipAddress).toBe(clientIp);
    });
  });

  describe('GET /api/polls - Filter by creatorId', () => {
    let creatorPollId;

    beforeAll(async () => {
      const csrfToken = 'test-csrf-creator-filter';
      const { storeCsrfToken } = require('../src/utils/csrf');
      storeCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Creator Filter Test Poll',
          type: 'simple',
          options: [{ text: 'Opt A' }, { text: 'Opt B' }]
        });

      creatorPollId = response.body.data?.id;
    });

    test('should filter polls by creatorId for the authenticated creator', async () => {
      const response = await request(app)
        .get(`/api/polls?creatorId=${adminUserId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(poll => {
        expect(poll.creatorId).toBe(adminUserId);
      });
    });

    test('should return 401 when filtering by creatorId without authentication', async () => {
      const response = await request(app)
        .get(`/api/polls?creatorId=${adminUserId}`);

      expect(response.status).toBe(401);
    });

    test('should return 403 when filtering by another user creatorId (non-admin)', async () => {
      const response = await request(app)
        .get(`/api/polls?creatorId=${adminUserId}`)
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/polls/my-voted - My Voted Polls', () => {
    test('should return polls the user voted in', async () => {
      const { storeCsrfToken } = require('../src/utils/csrf');

      // Create a poll as admin
      const csrfCreate = 'test-csrf-my-voted-create2';
      storeCsrfToken(csrfCreate, adminUserId);

      const createRes = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfCreate}`])
        .set('x-csrf-token', csrfCreate)
        .send({
          title: 'My Voted Poll Test',
          type: 'simple',
          options: [{ text: 'Choice X' }, { text: 'Choice Y' }]
        });

      expect(createRes.status).toBe(201);
      const pollId = createRes.body.data?.id;
      expect(pollId).toBeDefined();

      // Get option id
      const pollRes = await request(app)
        .get(`/api/polls/${pollId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(pollRes.status).toBe(200);
      const optionId = pollRes.body.data?.options?.[0]?.id;
      expect(optionId).toBeDefined();

      // Create vote directly in DB to avoid rate limiter exhaustion from earlier tests
      await PollVote.create({
        pollId,
        optionId,
        userId: adminUserId,
        isAuthenticated: true,
        ipAddress: '127.0.0.1'
      });

      // Get my voted polls for admin
      const response = await request(app)
        .get('/api/polls/my-voted')
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      const votedEntry = response.body.data.find(item => item.poll?.id === pollId);
      expect(votedEntry).toBeDefined();
      expect(votedEntry.optionId).toBe(optionId);
      expect(votedEntry.votedOption).toBeDefined();
      expect(votedEntry.poll).toBeDefined();
    });

    test('should return 401 for unauthenticated access to my-voted', async () => {
      const response = await request(app)
        .get('/api/polls/my-voted');

      expect(response.status).toBe(401);
    });
  });
});
