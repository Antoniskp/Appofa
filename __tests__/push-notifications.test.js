/**
 * Tests for push notification infrastructure:
 *   - POST /api/push/subscribe (save subscription)
 *   - DELETE /api/push/subscribe (remove subscription)
 *   - pushService.sendPushToUser (badge payload includes unreadCount)
 *   - notificationService.createNotification fires push (fire-and-forget)
 *   - Service worker sw.js defensive JSON parsing
 */

const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');
const fs = require('fs');
const path = require('path');

// Mock web-push so tests don't need real VAPID keys
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

const webPush = require('web-push');
const pushService = require('../src/services/pushService');
const pushRoutes = require('../src/routes/pushRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/push', pushRoutes);

const loginApp = express();
loginApp.use(express.json());
loginApp.use('/api/auth', authRoutes);

// VAPID env needed for pushService to configure
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-private-key';
process.env.VAPID_MAILTO = 'mailto:admin@test.com';

describe('Push Notification routes', () => {
  let userToken;
  let userId;

  const csrfToken = 'push-test-csrf';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await User.create({
      username: 'pushuser',
      email: 'pushuser@test.com',
      password: 'pushpass123',
      role: 'viewer',
      firstNameNative: 'Push',
      lastNameNative: 'User',
    });

    const loginRes = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'pushuser@test.com', password: 'pushpass123' });

    const cookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    userToken = cookie?.split(';')[0].replace('auth_token=', '');

    userId = loginRes.body?.data?.user?.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const authHeaders = () => {
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`auth_token=${userToken}`, `csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  const validSubscription = () => ({
    endpoint: 'https://push.example.com/sub/test-endpoint',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaze0ByL2sGpIqVb9y1XBiSBVhXBcNSqcqN3mFmCNXpLGN',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  });

  describe('POST /api/push/subscribe', () => {
    it('saves a valid push subscription', async () => {
      const res = await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send(validSubscription());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when endpoint is missing', async () => {
      const res = await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send({ keys: { p256dh: 'x', auth: 'y' } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when keys are missing', async () => {
      const res = await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send({ endpoint: 'https://push.example.com/sub/test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/push/subscribe')
        .send(validSubscription());

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/push/status', () => {
    it('returns diagnostic push status for the current user', async () => {
      await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send({
          endpoint: 'https://push.example.com/sub/status-test',
          keys: { p256dh: 'BNcRdreALRFX-status', auth: 'tBHItJI5-status' },
        });

      const res = await request(app)
        .get('/api/push/status')
        .set(authHeaders());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscriptionCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.vapid).toEqual(expect.objectContaining({
        configured: true,
        hasPublicKey: true,
        hasPrivateKey: true,
        hasMailto: true,
      }));
      expect(res.body.data.providerHosts).toContain('push.example.com');
    });
  });

  describe('POST /api/push/test', () => {
    it('sends a test push to the current user subscriptions', async () => {
      webPush.sendNotification.mockClear();

      await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send({
          endpoint: 'https://push.example.com/sub/direct-test',
          keys: { p256dh: 'BNcRdreALRFX-direct', auth: 'tBHItJI5-direct' },
        });

      const res = await request(app)
        .post('/api/push/test')
        .set(authHeaders());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sent).toBeGreaterThanOrEqual(1);
      expect(webPush.sendNotification).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/push/subscribe', () => {
    it('removes a subscription by endpoint', async () => {
      // First create a subscription to remove
      await request(app)
        .post('/api/push/subscribe')
        .set(authHeaders())
        .send({
          endpoint: 'https://push.example.com/sub/to-delete',
          keys: { p256dh: 'BNcRdreALRFX', auth: 'tBHItJI5svbpez7K' },
        });

      const res = await request(app)
        .delete('/api/push/subscribe')
        .set(authHeaders())
        .send({ endpoint: 'https://push.example.com/sub/to-delete' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when endpoint is missing', async () => {
      const res = await request(app)
        .delete('/api/push/subscribe')
        .set(authHeaders())
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('pushService.sendPushToUser', () => {
    beforeEach(() => {
      webPush.sendNotification.mockClear();
      webPush.sendNotification.mockResolvedValue({ statusCode: 201 });
    });

    it('calls webPush.sendNotification with JSON payload including unreadCount as number', async () => {
      const { PushSubscription } = require('../src/models');

      await PushSubscription.create({
        userId,
        endpoint: 'https://push.example.com/sub/badge-test',
        p256dh: 'BNcRdreALRFXTkOO',
        auth: 'tBHItJI5svbp',
      });

      await pushService.sendPushToUser(userId, {
        title: 'Test',
        body: 'Hello',
        unreadCount: 5,
        url: '/notifications',
      });

      expect(webPush.sendNotification).toHaveBeenCalled();
      const callArgs = webPush.sendNotification.mock.calls[0];
      const sentPayload = JSON.parse(callArgs[1]);
      expect(sentPayload.unreadCount).toBe(5);
      expect(typeof sentPayload.unreadCount).toBe('number');
      expect(callArgs[2]).toEqual(expect.objectContaining({
        TTL: expect.any(Number),
        urgency: 'normal',
      }));
    });

    it('normalizes unsafe push payload fields before delivery', async () => {
      const { PushSubscription } = require('../src/models');

      await PushSubscription.create({
        userId,
        endpoint: 'https://push.example.com/sub/safe-payload',
        p256dh: 'BNcRdreALRFXTkOO-safe',
        auth: 'tBHItJI5svbp-safe',
      });

      await pushService.sendPushToUser(userId, {
        title: 'x'.repeat(300),
        body: 'body',
        unreadCount: '10000',
        url: 'https://evil.example/phish',
      });

      const sentPayload = JSON.parse(webPush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.title.length).toBeLessThanOrEqual(120);
      expect(sentPayload.unreadCount).toBe(999);
      expect(sentPayload.url).toBe('/notifications');
    });

    it('removes stale push subscriptions after 404 or 410 provider responses', async () => {
      const { PushSubscription } = require('../src/models');
      const endpoint = 'https://push.example.com/sub/stale';

      const stale = await PushSubscription.create({
        userId,
        endpoint,
        p256dh: 'BNcRdreALRFXTkOO-stale',
        auth: 'tBHItJI5svbp-stale',
      });

      webPush.sendNotification.mockImplementation(async (subscription) => {
        if (subscription.endpoint === endpoint) {
          throw Object.assign(new Error('gone'), { statusCode: 410 });
        }
        return { statusCode: 201 };
      });

      const result = await pushService.sendPushToUser(userId, {
        title: 'Stale',
        body: '',
        unreadCount: 1,
        url: '/notifications',
      });

      expect(result.staleRemoved).toBeGreaterThanOrEqual(1);
      await expect(PushSubscription.findByPk(stale.id)).resolves.toBeNull();
    });

    it('does not throw when VAPID keys are missing', async () => {
      const origPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const origPrivate = process.env.VAPID_PRIVATE_KEY;
      const origMailto = process.env.VAPID_MAILTO;

      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_MAILTO;

      // Force VAPID re-check by clearing the cached flag via jest.spyOn
      // (pushService caches _vapidConfigured; simply calling with missing keys suffices)
      await expect(
        pushService.sendPushToUser(999, { title: 'x', body: '', unreadCount: 1, url: '/' })
      ).resolves.toEqual(expect.objectContaining({
        sent: 0,
        skipped: true,
      }));

      // Restore
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = origPublic;
      process.env.VAPID_PRIVATE_KEY = origPrivate;
      process.env.VAPID_MAILTO = origMailto;
    });
  });

  describe('notificationService.createNotification fires push', () => {
    it('calls pushService.sendPushToUser after creating a notification', async () => {
      const notificationService = require('../src/services/notificationService');

      const sendPushSpy = jest.spyOn(pushService, 'sendPushToUser').mockResolvedValue(undefined);
      // Mock getUnreadCount so we don't depend on timing of async DB query
      const getUnreadSpy = jest.spyOn(pushService, 'getUnreadCount').mockResolvedValue(3);

      const testUser = await User.findOne({ where: { username: 'pushuser' } });
      expect(testUser).toBeTruthy();

      await notificationService.createNotification({
        userId: testUser.id,
        type: 'system_announcement',
        title: 'Test push',
        actionUrl: '/notifications',
      });

      // Flush the setImmediate callback, then its async chain
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));

      expect(sendPushSpy).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({
          title: 'Test push',
          url: '/notifications',
          unreadCount: 3,
        })
      );

      sendPushSpy.mockRestore();
      getUnreadSpy.mockRestore();
    });
  });

  describe('pushService.saveSubscription', () => {
    it('rejects non-https subscription endpoints', async () => {
      await expect(
        pushService.saveSubscription(userId, {
          endpoint: 'http://push.example.com/sub/not-secure',
          keys: { p256dh: 'x', auth: 'y' },
        })
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});

describe('Service worker sw.js defensive JSON parsing', () => {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');

  it('uses try/catch around event.data.json()', () => {
    const source = fs.readFileSync(swPath, 'utf8');
    expect(source).toMatch(/try\s*\{[\s\S]*event\.data\?\.json/);
  });

  it('uses Number.isFinite() for unreadCount validation', () => {
    const source = fs.readFileSync(swPath, 'utf8');
    expect(source).toContain('Number.isFinite');
  });

  it('includes setAppBadge call in the push handler', () => {
    const source = fs.readFileSync(swPath, 'utf8');
    expect(source).toContain('setAppBadge');
  });

  it('falls back to empty object on invalid JSON', () => {
    const source = fs.readFileSync(swPath, 'utf8');
    expect(source).toMatch(/data\s*=\s*\{\}/);
  });
});

