const request = require('supertest');
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { storeCsrfToken } = require('../src/utils/csrf');
const {
  sequelize,
  User,
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterSendLog,
} = require('../src/models');
const { issueUnsubscribeToken } = require('../src/services/newsletterService');

const authRoutes = require('../src/routes/authRoutes');
const newsletterRoutes = require('../src/routes/newsletterRoutes');

process.env.JWT_SECRET = 'newsletter-test-secret';
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '2525';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'smtp-user';
process.env.SMTP_PASS = 'smtp-pass';

jest.mock('nodemailer');

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
  let sendMailMock;

  beforeAll(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

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
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: 'mock-message-id' });
    await NewsletterSendLog.destroy({ where: {} });
    await NewsletterCampaign.destroy({ where: {} });
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

  test('admin can create campaign draft and list/get it', async () => {
    const createCsrf = csrfHeadersFor('newsletter-campaign-create-csrf', adminUserId);
    const createResponse = await request(app)
      .post('/api/newsletter/admin/campaigns')
      .set('Cookie', [`auth_token=${adminToken}`, ...createCsrf.Cookie])
      .set('x-csrf-token', createCsrf['x-csrf-token'])
      .send({
        subject: 'Weekly update',
        previewText: 'What happened this week',
        htmlContent: '<p>Hello subscribers</p>',
        textContent: 'Hello subscribers',
        audienceFilters: { locale: 'en', source: 'website', tag: 'news' },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.campaign.status).toBe('draft');

    const listResponse = await request(app)
      .get('/api/newsletter/admin/campaigns')
      .set('Cookie', [`auth_token=${adminToken}`]);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.campaigns).toHaveLength(1);

    const campaignId = createResponse.body.data.campaign.id;
    const getResponse = await request(app)
      .get(`/api/newsletter/admin/campaigns/${campaignId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.campaign.subject).toBe('Weekly update');
    expect(getResponse.body.data.estimatedRecipients).toBe(0);
  });

  test('send test email does not create campaign send logs', async () => {
    const createCsrf = csrfHeadersFor('newsletter-campaign-test-create-csrf', adminUserId);
    const createResponse = await request(app)
      .post('/api/newsletter/admin/campaigns')
      .set('Cookie', [`auth_token=${adminToken}`, ...createCsrf.Cookie])
      .set('x-csrf-token', createCsrf['x-csrf-token'])
      .send({
        subject: 'Campaign test',
        htmlContent: '<p>Body</p>',
      });

    const campaignId = createResponse.body.data.campaign.id;

    const testCsrf = csrfHeadersFor('newsletter-campaign-test-send-csrf', adminUserId);
    const testResponse = await request(app)
      .post(`/api/newsletter/admin/campaigns/${campaignId}/test-send`)
      .set('Cookie', [`auth_token=${adminToken}`, ...testCsrf.Cookie])
      .set('x-csrf-token', testCsrf['x-csrf-token'])
      .send({ email: 'test-recipient@test.com' });

    expect(testResponse.status).toBe(200);
    expect(testResponse.body.success).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const logsCount = await NewsletterSendLog.count({ where: { campaignId } });
    expect(logsCount).toBe(0);
  });

  test('send now applies audience filters, excludes unsubscribed, and writes logs', async () => {
    await NewsletterSubscriber.bulkCreate([
      {
        email: 'eligible-en@test.com',
        status: 'subscribed',
        source: 'website',
        locale: 'en',
        tags: ['news', 'promo'],
        subscribedAt: new Date(),
      },
      {
        email: 'eligible-en-2@test.com',
        status: 'subscribed',
        source: 'website',
        locale: 'en',
        tags: ['news'],
        subscribedAt: new Date(),
      },
      {
        email: 'wrong-locale@test.com',
        status: 'subscribed',
        source: 'website',
        locale: 'el',
        tags: ['news'],
        subscribedAt: new Date(),
      },
      {
        email: 'unsubscribed@test.com',
        status: 'unsubscribed',
        source: 'website',
        locale: 'en',
        tags: ['news'],
      },
    ]);

    const createCsrf = csrfHeadersFor('newsletter-campaign-send-create-csrf', adminUserId);
    const createResponse = await request(app)
      .post('/api/newsletter/admin/campaigns')
      .set('Cookie', [`auth_token=${adminToken}`, ...createCsrf.Cookie])
      .set('x-csrf-token', createCsrf['x-csrf-token'])
      .send({
        subject: 'Audience campaign',
        htmlContent: '<p>Audience body</p>',
        audienceFilters: { locale: 'en', source: 'website', tag: 'news' },
      });

    const campaignId = createResponse.body.data.campaign.id;

    sendMailMock.mockImplementation(async ({ to }) => {
      if (to === 'eligible-en-2@test.com') {
        throw new Error('Simulated SMTP failure');
      }
      return { messageId: `msg-${to}` };
    });

    const sendCsrf = csrfHeadersFor('newsletter-campaign-send-now-csrf', adminUserId);
    const sendResponse = await request(app)
      .post(`/api/newsletter/admin/campaigns/${campaignId}/send`)
      .set('Cookie', [`auth_token=${adminToken}`, ...sendCsrf.Cookie])
      .set('x-csrf-token', sendCsrf['x-csrf-token'])
      .send({});

    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body.success).toBe(true);
    expect(sendResponse.body.data.summary.totalRecipients).toBe(2);
    expect(sendResponse.body.data.summary.successCount).toBe(1);
    expect(sendResponse.body.data.summary.failureCount).toBe(1);

    const campaign = await NewsletterCampaign.findByPk(campaignId);
    expect(campaign.status).toBe('failed');
    expect(campaign.totalRecipients).toBe(2);
    expect(campaign.successCount).toBe(1);
    expect(campaign.failureCount).toBe(1);
    expect(campaign.sentAt).toBeTruthy();

    const successfulEmailCall = sendMailMock.mock.calls.find((call) => call[0]?.to === 'eligible-en@test.com');
    const failedEmailCall = sendMailMock.mock.calls.find((call) => call[0]?.to === 'eligible-en-2@test.com');
    expect(successfulEmailCall).toBeTruthy();
    expect(failedEmailCall).toBeTruthy();
    expect(successfulEmailCall[0].subject).toBe('Audience campaign');
    expect(successfulEmailCall[0].html).toContain('Appofa Newsletter');
    expect(successfulEmailCall[0].html).toContain('unsubscribe');
    expect(successfulEmailCall[0].text).toContain('Unsubscribe:');

    const logs = await NewsletterSendLog.findAll({
      where: { campaignId },
      order: [['email', 'ASC']],
    });
    expect(logs).toHaveLength(2);
    expect(logs[0].email).toBe('eligible-en-2@test.com');
    expect(logs[0].status).toBe('failed');
    expect(logs[0].errorMessage).toContain('Simulated SMTP failure');
    expect(logs[1].email).toBe('eligible-en@test.com');
    expect(logs[1].status).toBe('sent');
    expect(logs[1].providerMessageId).toBe('msg-eligible-en@test.com');
  });
});
