const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Poll, PollOption, Vote } = require('../src/models');

describe('Poll API Tests', () => {
  let adminToken;
  let userToken;
  let adminCsrfToken;
  let userCsrfToken;
  let adminUser;
  let regularUser;
  let testPoll;
  let testPollOptions;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    regularUser = await User.create({
      username: 'user',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    });

    // Login users and get CSRF tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    
    const adminCookies = adminLogin.headers['set-cookie'];
    adminToken = adminCookies
      .find(c => c.startsWith('auth_token='))
      .split(';')[0]
      .replace('auth_token=', '');
    adminCsrfToken = adminCookies
      .find(c => c.startsWith('csrf_token='))
      .split(';')[0]
      .replace('csrf_token=', '');

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    
    const userCookies = userLogin.headers['set-cookie'];
    userToken = userCookies
      .find(c => c.startsWith('auth_token='))
      .split(';')[0]
      .replace('auth_token=', '');
    userCsrfToken = userCookies
      .find(c => c.startsWith('csrf_token='))
      .split(';')[0]
      .replace('csrf_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/polls - Create Poll', () => {
    it('should create a simple poll with options', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'What is your favorite color?',
          description: 'Choose your favorite color from the options below',
          pollType: 'simple',
          questionType: 'single-choice',
          options: [
            { optionText: 'Red' },
            { optionText: 'Blue' },
            { optionText: 'Green' }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.title).toBe('What is your favorite color?');
      expect(response.body.data.poll.options).toHaveLength(3);
      expect(response.body.data.poll.creator.username).toBe('user');
      testPoll = response.body.data.poll;
      testPollOptions = response.body.data.poll.options;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/polls')
        .send({
          title: 'Test Poll',
          options: [
            { optionText: 'Option 1' },
            { optionText: 'Option 2' }
          ]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with title too short', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Test',
          options: [
            { optionText: 'Option 1' },
            { optionText: 'Option 2' }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Title');
    });

    it('should fail with less than 2 options', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Test Poll with One Option',
          options: [
            { optionText: 'Only Option' }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 2 options');
    });

    it('should create a ranked-choice poll', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Rank your favorite programming languages',
          questionType: 'ranked-choice',
          options: [
            { optionText: 'JavaScript' },
            { optionText: 'Python' },
            { optionText: 'Java' },
            { optionText: 'Go' }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.questionType).toBe('ranked-choice');
    });

    it('should create a free-text poll without options', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'What improvements would you like to see?',
          questionType: 'free-text',
          description: 'Please share your thoughts'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.questionType).toBe('free-text');
      expect(response.body.data.poll.options).toHaveLength(0);
    });

    it('should create poll with unauthenticated voting enabled', async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Public Poll',
          allowUnauthenticatedVoting: true,
          options: [
            { optionText: 'Yes' },
            { optionText: 'No' }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.allowUnauthenticatedVoting).toBe(true);
    });
  });

  describe('GET /api/polls - List Polls', () => {
    it('should list all polls without authentication', async () => {
      const response = await request(app)
        .get('/api/polls')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.polls)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/polls?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.polls.length).toBeLessThanOrEqual(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/polls?status=open')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.polls.forEach(poll => {
        expect(poll.status).toBe('open');
      });
    });

    it('should filter by creator', async () => {
      const response = await request(app)
        .get(`/api/polls?creatorId=${regularUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.polls.forEach(poll => {
        expect(poll.creatorId).toBe(regularUser.id);
      });
    });

    it('should include vote counts and option counts', async () => {
      const response = await request(app)
        .get('/api/polls')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.polls.length > 0) {
        const poll = response.body.data.polls[0];
        expect(poll.voteCount).toBeDefined();
        expect(poll.optionCount).toBeDefined();
      }
    });
  });

  describe('GET /api/polls/:id - Get Poll by ID', () => {
    it('should get poll details', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.id).toBe(testPoll.id);
      expect(response.body.data.poll.options).toBeDefined();
      expect(response.body.data.poll.creator).toBeDefined();
      expect(response.body.data.poll.totalVotes).toBeDefined();
    });

    it('should return 404 for non-existent poll', async () => {
      const response = await request(app)
        .get('/api/polls/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should include vote counts per option', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.poll.options.forEach(option => {
        expect(option.voteCount).toBeDefined();
        expect(typeof option.voteCount).toBe('number');
      });
    });
  });

  describe('POST /api/polls/:id/vote - Submit Vote', () => {
    it('should submit a vote as authenticated user', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/vote`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          optionId: testPollOptions[0].id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.voteCounts).toBeDefined();
      expect(response.body.data.totalVotes).toBeGreaterThan(0);
    });

    it('should prevent duplicate votes', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/vote`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          optionId: testPollOptions[0].id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already voted');
    });

    it('should fail to vote on non-existent poll', async () => {
      const response = await request(app)
        .post('/api/polls/99999/vote')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionId: testPollOptions[0].id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid option ID', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionId: 99999
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid option');
    });
  });

  describe('POST /api/polls/:id/vote - Unauthenticated Voting', () => {
    let publicPoll;

    beforeAll(async () => {
      // Create a poll that allows unauthenticated voting
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Public Opinion Poll',
          allowUnauthenticatedVoting: true,
          options: [
            { optionText: 'Agree' },
            { optionText: 'Disagree' }
          ]
        });
      publicPoll = response.body.data.poll;
    });

    it('should allow unauthenticated vote with sessionId', async () => {
      const response = await request(app)
        .post(`/api/polls/${publicPoll.id}/vote`)
        .send({
          optionId: publicPoll.options[0].id,
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVotes).toBeGreaterThan(0);
    });

    it('should prevent duplicate unauthenticated votes', async () => {
      const response = await request(app)
        .post(`/api/polls/${publicPoll.id}/vote`)
        .send({
          optionId: publicPoll.options[0].id,
          sessionId: 'test-session-123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already voted');
    });

    it('should require sessionId for unauthenticated votes', async () => {
      const response = await request(app)
        .post(`/api/polls/${publicPoll.id}/vote`)
        .send({
          optionId: publicPoll.options[0].id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session ID');
    });

    it('should reject unauthenticated vote on protected poll', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/vote`)
        .send({
          optionId: testPollOptions[1].id,
          sessionId: 'test-session-456'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('POST /api/polls/:id/vote - Ranked Choice Voting', () => {
    let rankedPoll;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Best Framework Ranking',
          questionType: 'ranked-choice',
          options: [
            { optionText: 'React' },
            { optionText: 'Vue' },
            { optionText: 'Angular' },
            { optionText: 'Svelte' }
          ]
        });
      rankedPoll = response.body.data.poll;
    });

    it('should submit ranked-choice votes', async () => {
      const response = await request(app)
        .post(`/api/polls/${rankedPoll.id}/vote`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          optionIds: [
            rankedPoll.options[0].id,
            rankedPoll.options[2].id,
            rankedPoll.options[1].id
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVotes).toBeGreaterThan(0);
    });

    it('should fail ranked-choice vote with invalid option', async () => {
      const response = await request(app)
        .post(`/api/polls/${rankedPoll.id}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionIds: [99999, rankedPoll.options[0].id]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid option');
    });
  });

  describe('POST /api/polls/:id/vote - Free Text Voting', () => {
    let freeTextPoll;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Suggestions for Improvement',
          questionType: 'free-text'
        });
      freeTextPoll = response.body.data.poll;
    });

    it('should submit free-text response', async () => {
      const response = await request(app)
        .post(`/api/polls/${freeTextPoll.id}/vote`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          freeTextResponse: 'I think we should add more features to the platform.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail without free-text response', async () => {
      const response = await request(app)
        .post(`/api/polls/${freeTextPoll.id}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/polls/:id/results - Get Poll Results', () => {
    it('should get poll results with vote counts', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVotes).toBeDefined();
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.chartData).toBeDefined();
    });

    it('should include percentages in results', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.results.forEach(result => {
        expect(result.percentage).toBeDefined();
        expect(typeof result.percentage).toBe('number');
      });
    });

    it('should separate authenticated and unauthenticated counts', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.results.forEach(result => {
        expect(result.authenticatedVotes).toBeDefined();
        expect(result.unauthenticatedVotes).toBeDefined();
      });
    });

    it('should return chart-ready data', async () => {
      const response = await request(app)
        .get(`/api/polls/${testPoll.id}/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chartData.labels).toBeDefined();
      expect(response.body.data.chartData.values).toBeDefined();
      expect(response.body.data.chartData.colors).toBeDefined();
      expect(Array.isArray(response.body.data.chartData.labels)).toBe(true);
    });
  });

  describe('PUT /api/polls/:id - Update Poll', () => {
    it('should update poll as creator', async () => {
      const response = await request(app)
        .put(`/api/polls/${testPoll.id}`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          description: 'Updated description for the poll'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.description).toBe('Updated description for the poll');
    });

    it('should update poll as admin', async () => {
      const response = await request(app)
        .put(`/api/polls/${testPoll.id}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          status: 'closed'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poll.status).toBe('closed');
    });

    it('should fail to update without authentication', async () => {
      const response = await request(app)
        .put(`/api/polls/${testPoll.id}`)
        .send({
          description: 'Unauthorized update'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent non-creator from updating poll', async () => {
      // Create poll as regular user
      const pollResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'User Specific Poll',
          options: [
            { optionText: 'Option A' },
            { optionText: 'Option B' }
          ]
        });
      const userPoll = pollResponse.body.data.poll;

      // Create another user
      await User.create({
        username: 'otheruser',
        email: 'other@test.com',
        password: 'password123',
        role: 'user'
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@test.com', password: 'password123' });
      const otherCookies = otherLogin.headers['set-cookie'];
      const otherToken = otherCookies
        .find(c => c.startsWith('auth_token='))
        .split(';')[0]
        .replace('auth_token=', '');
      const otherCsrfToken = otherCookies
        .find(c => c.startsWith('csrf_token='))
        .split(';')[0]
        .replace('csrf_token=', '');

      // Try to update as different user
      const response = await request(app)
        .put(`/api/polls/${userPoll.id}`)
        .set('Cookie', [`auth_token=${otherToken}`, `csrf_token=${otherCsrfToken}`])
        .set('x-csrf-token', otherCsrfToken)
        .send({
          description: 'Hacked description'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    it('should prevent updating poll title after votes', async () => {
      // testPoll already has votes from earlier tests
      const response = await request(app)
        .put(`/api/polls/${testPoll.id}`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Changed Title After Votes'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot modify');
    });
  });

  describe('DELETE /api/polls/:id - Delete Poll', () => {
    let pollToDelete;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Poll to be Deleted',
          options: [
            { optionText: 'Option 1' },
            { optionText: 'Option 2' }
          ]
        });
      pollToDelete = response.body.data.poll;
    });

    it('should delete poll as creator', async () => {
      const response = await request(app)
        .delete(`/api/polls/${pollToDelete.id}`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify poll is deleted
      const getResponse = await request(app)
        .get(`/api/polls/${pollToDelete.id}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should fail to delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/polls/${testPoll.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete any poll', async () => {
      // Create poll as regular user
      const pollResponse = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Poll to be Deleted by Admin',
          options: [
            { optionText: 'Yes' },
            { optionText: 'No' }
          ]
        });
      const poll = pollResponse.body.data.poll;

      // Delete as admin
      const response = await request(app)
        .delete(`/api/polls/${poll.id}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/polls/:id/options - Add Poll Option', () => {
    let pollWithUserOptions;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/polls')
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          title: 'Poll with User-Added Options',
          allowUserAddOptions: true,
          options: [
            { optionText: 'Initial Option 1' },
            { optionText: 'Initial Option 2' }
          ]
        });
      pollWithUserOptions = response.body.data.poll;
    });

    it('should add option to poll that allows it', async () => {
      const response = await request(app)
        .post(`/api/polls/${pollWithUserOptions.id}/options`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`])
        .set('x-csrf-token', adminCsrfToken)
        .send({
          optionText: 'User Added Option'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.option.optionText).toBe('User Added Option');
      expect(response.body.data.option.createdById).toBe(adminUser.id);
    });

    it('should fail to add option without authentication', async () => {
      const response = await request(app)
        .post(`/api/polls/${pollWithUserOptions.id}/options`)
        .send({
          optionText: 'Unauthorized Option'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to add option to poll that does not allow it', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/options`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionText: 'Not Allowed Option'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('does not allow');
    });

    it('should fail to add option to closed poll', async () => {
      // Close the poll first
      await request(app)
        .put(`/api/polls/${pollWithUserOptions.id}`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          status: 'closed'
        });

      const response = await request(app)
        .post(`/api/polls/${pollWithUserOptions.id}/options`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionText: 'Late Option'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('closed');
    });
  });

  describe('POST /api/polls/:id/vote - Closed Poll', () => {
    it('should fail to vote on closed poll', async () => {
      // testPoll is already closed from earlier test
      const response = await request(app)
        .post(`/api/polls/${testPoll.id}/vote`)
        .set('Cookie', [`auth_token=${userToken}`, `csrf_token=${userCsrfToken}`])
        .set('x-csrf-token', userCsrfToken)
        .send({
          optionId: testPollOptions[1].id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('closed');
    });
  });
});
