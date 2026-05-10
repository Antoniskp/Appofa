const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { storeCsrfToken } = require('../src/utils/csrf');
const { sequelize, User, NewsletterSubscriber } = require('../src/models');
const { issueUnsubscribeToken } = require('../src/services/newsletterService');

const authRoutes = require('../src/routes/authRoutes');
const newsletterRoutes = require('../src/routes/newsletterRoutes');

process.env.JWT_SECRET = 'newsletter-test-secret';
process.env.NODE_ENV = 'test';

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);

async function createAndLoginUser({ username, email, role = 'viewer' }) {
  const password = 'Pass1234!';
  await User.create({
    username,
    email,
    password,
    role,
    firstNameNative: username,
    lastNameNative: 'User',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const authCookie = loginResponse.headers['set-cookie']?.find((cookie) => cookie.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  const user = await User.findOne({ where: { email } });
  return { token, userId: user.id };
}

function csrfHeadersFor(csrfToken, userId) {
  storeCsrfToken(csrfToken, userId);
  return {
    Cookie: [`csrf_token=${csrfToken}`],
    'x-csrf-token': csrfToken,
  };
}

describe('Newsletter API', () => {
  let adminToken;
  let adminUserId;
  let moderatorToken;
  let moderatorUserId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    ({ token: adminToken, userId: adminUserId } = await createAndLoginUser({
      username: 'newsletter_admin',
      email: 'newsletter-admin@test.com',
      role: 'admin',
    }));
    ({ token: moderatorToken, userId: moderatorUserId } = await createAndLoginUser({
      username: 'newsletter_moderator',
      email: 'newsletter-mod@test.com',
      role: 'moderator',
    }));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await NewsletterSubscriber.destroy({ where: {} });
  });

  test('public subscribe normalizes email and is duplicate-safe', async () => {
    const first = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: '  User@Test.COM  ', locale: 'EN' });

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);

    const second = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'user@test.com' });

    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);

    const subscribers = await NewsletterSubscriber.findAll({ where: { email: 'user@test.com' } });
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].status).toBe('subscribed');
    expect(subscribers[0].locale).toBe('en');
    expect(subscribers[0].unsubscribeTokenHash).toBeTruthy();
  });

  test('public subscribe re-activates unsubscribed email', async () => {
    const subscriber = await NewsletterSubscriber.create({
      email: 'reactivate@test.com',
      status: 'unsubscribed',
      source: 'import',
      unsubscribedAt: new Date(),
    });

    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'reactivate@test.com' });

    await subscriber.reload();
    expect(subscriber.status).toBe('subscribed');
    expect(subscriber.unsubscribedAt).toBeNull();
    expect(subscriber.subscribedAt).toBeTruthy();
  });

  test('public unsubscribe accepts secure token and unsubscribes subscriber', async () => {
    const subscriber = await NewsletterSubscriber.create({
      email: 'unsubscribe-me@test.com',
      status: 'subscribed',
      source: 'website',
      subscribedAt: new Date(),
    });
    const rawToken = await issueUnsubscribeToken(subscriber);

    const response = await request(app)
      .post('/api/newsletter/unsubscribe')
      .send({ token: rawToken });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    await subscriber.reload();
    expect(subscriber.status).toBe('unsubscribed');
    expect(subscriber.unsubscribedAt).toBeTruthy();
  });

  test('admin and moderator access rules are enforced', async () => {
    await NewsletterSubscriber.create({
      email: 'mod-visible@test.com',
      status: 'subscribed',
      source: 'website',
      subscribedAt: new Date(),
    });

    const moderatorList = await request(app)
      .get('/api/newsletter/admin/subscribers')
      .set('Cookie', [`auth_token=${moderatorToken}`]);
    expect(moderatorList.status).toBe(200);
    expect(moderatorList.body.success).toBe(true);

    const moderatorStats = await request(app)
      .get('/api/newsletter/admin/stats')
      .set('Cookie', [`auth_token=${moderatorToken}`]);
    expect(moderatorStats.status).toBe(200);
    expect(moderatorStats.body.success).toBe(true);

    const modCsrf = csrfHeadersFor('newsletter-mod-csrf', moderatorUserId);
    const moderatorCreate = await request(app)
      .post('/api/newsletter/admin/subscribers')
      .set('Cookie', [`auth_token=${moderatorToken}`, ...modCsrf.Cookie])
      .set('x-csrf-token', modCsrf['x-csrf-token'])
      .send({ email: 'mod-write@test.com' });
    expect(moderatorCreate.status).toBe(403);
  });

  test('admin can add and bulk add subscribers', async () => {
    const createCsrf = csrfHeadersFor('newsletter-admin-create-csrf', adminUserId);
    const createResponse = await request(app)
      .post('/api/newsletter/admin/subscribers')
      .set('Cookie', [`auth_token=${adminToken}`, ...createCsrf.Cookie])
      .set('x-csrf-token', createCsrf['x-csrf-token'])
      .send({
        email: 'admin-add@test.com',
        locale: 'el',
        tags: ['campaign-a'],
        notes: 'Consent from event booth',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.created).toBe(true);

    const bulkCsrf = csrfHeadersFor('newsletter-admin-bulk-csrf', adminUserId);
    const bulkResponse = await request(app)
      .post('/api/newsletter/admin/subscribers/bulk')
      .set('Cookie', [`auth_token=${adminToken}`, ...bulkCsrf.Cookie])
      .set('x-csrf-token', bulkCsrf['x-csrf-token'])
      .send({
        emailsText: 'bulk-one@test.com\nbulk-two@test.com\ninvalid-email',
        status: 'subscribed',
      });

    expect(bulkResponse.status).toBe(200);
    expect(bulkResponse.body.success).toBe(true);
    expect(bulkResponse.body.data.added).toBe(2);
    expect(bulkResponse.body.data.invalid).toHaveLength(1);
  });
});
