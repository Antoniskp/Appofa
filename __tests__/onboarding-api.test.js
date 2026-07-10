const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../src/models');
const authRoutes = require('../src/routes/authRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'onboarding-test-secret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const csrfHeaderFor = (token) => ({
  Cookie: [`csrf_token=${token}`],
  'x-csrf-token': token,
});

describe('Onboarding API endpoints', () => {
  let authToken;
  let userId;
  const csrfToken = 'test-csrf-onboarding';

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    // Create and log in a test user
    await User.create({
      username: 'onboardtest',
      email: 'onboard@test.com',
      password: 'Test1234!',
      role: 'viewer',
      emailVerified: true,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'onboard@test.com', password: 'Test1234!' });

    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    authToken = cookie?.split(';')[0]?.replace('auth_token=', '');
    expect(authToken).toBeTruthy();

    const user = await User.findOne({ where: { email: 'onboard@test.com' } });
    userId = user.id;
    storeCsrfToken(csrfToken, userId);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/auth/onboarding', () => {
    it('returns onboarding state for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.onboarding).toBeDefined();
      expect(res.body.data.onboarding.onboardingGoal).toBeNull();
      expect(res.body.data.onboarding.onboardingDismissed).toBe(false);
      expect(res.body.data.onboarding.onboardingCompletedAt).toBeNull();
    });

    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/onboarding');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/onboarding', () => {
    it('sets a valid onboarding goal', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: 'moderator' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.onboarding.onboardingGoal).toBe('moderator');

      const user = await User.findByPk(userId);
      expect(user.onboardingGoal).toBe('moderator');
    });

    it('rejects an invalid onboarding goal', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: 'invalid_goal' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('sets secondary goals as array', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: 'citizen', secondaryGoals: ['creator', 'moderator'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findByPk(userId);
      expect(user.onboardingGoal).toBe('citizen');
      const secondary = user.onboardingSecondaryGoals;
      expect(secondary).toContain('creator');
      expect(secondary).toContain('moderator');
    });

    it('rejects invalid secondary goals', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: 'citizen', secondaryGoals: ['invalid'] });

      expect(res.status).toBe(422);
    });

    it('sets dismissed flag', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ dismissed: true });

      expect(res.status).toBe(200);
      const user = await User.findByPk(userId);
      expect(user.onboardingDismissed).toBe(true);
    });

    it('sets completedAt when completed=true', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ completed: true });

      expect(res.status).toBe(200);
      const user = await User.findByPk(userId);
      expect(user.onboardingCompletedAt).not.toBeNull();
    });

    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app)
        .put('/api/auth/onboarding')
        .send({ goal: 'citizen' });
      expect(res.status).toBe(401);
    });

    it('accepts null goal to clear it', async () => {
      // First set a goal
      await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: 'citizen' });

      // Then clear it
      const res = await request(app)
        .put('/api/auth/onboarding')
        .set('Cookie', [`auth_token=${authToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({ goal: null });

      expect(res.status).toBe(200);
      const user = await User.findByPk(userId);
      expect(user.onboardingGoal).toBeNull();
    });
  });
});
