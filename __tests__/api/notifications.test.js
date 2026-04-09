const request = require('supertest');
const { sequelize, User, Notification } = require('../../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../../src/config/securityHeaders');

const authRoutes = require('../../src/routes/authRoutes');
const notificationRoutes = require('../../src/routes/notificationRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

describe('Notification System Tests', () => {
  let userAToken, userAId;
  let userBToken, userBId;

  const csrfToken = 'test-csrf-token-notifications';

  const csrfHeaders = (userId) => {
    const { storeCsrfToken } = require('../../src/utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken
    };
  };

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const user = await User.findOne({ where: { username } });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: userAToken, id: userAId } = await registerAndLogin('notif_userA'));
    ({ token: userBToken, id: userBId } = await registerAndLogin('notif_userB'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/notifications ───────────────────────────────────────────────

  describe('GET /api/notifications', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('returns paginated notification list when authenticated', async () => {
      // Seed a notification for userA
      await Notification.create({
        userId: userAId,
        type: 'system_announcement',
        title: 'Welcome!',
        body: 'Thanks for joining.',
        isRead: false
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', [`auth_token=${userAToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('filters unread notifications when unreadOnly=true', async () => {
      const res = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Cookie', [`auth_token=${userAToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.notifications.forEach(n => {
        expect(n.isRead).toBe(false);
      });
    });

    it('does not return another user\'s notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', [`auth_token=${userBToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // userB has no notifications seeded
      expect(res.body.data.total).toBe(0);
    });
  });

  // ── GET /api/notifications/unread-count ──────────────────────────────────

  describe('GET /api/notifications/unread-count', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.status).toBe(401);
    });

    it('returns unread count for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Cookie', [`auth_token=${userAToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
      expect(typeof res.body.data.count).toBe('number');
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ── PUT /api/notifications/read-all ─────────────────────────────────────

  describe('PUT /api/notifications/read-all', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).put('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('marks all notifications as read when authenticated with CSRF', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Cookie', [`auth_token=${userAToken}`, ...csrfHeaders(userAId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All notifications marked as read.');

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Cookie', [`auth_token=${userAToken}`]);
      expect(countRes.body.data.count).toBe(0);
    });
  });

  // ── PUT /api/notifications/:id/read ─────────────────────────────────────

  describe('PUT /api/notifications/:id/read', () => {
    let notifId;

    beforeAll(async () => {
      // Seed a fresh unread notification for userA
      const notif = await Notification.create({
        userId: userAId,
        type: 'badge_earned',
        title: 'New badge!',
        isRead: false
      });
      notifId = notif.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).put(`/api/notifications/${notifId}/read`);
      expect(res.status).toBe(401);
    });

    it('marks a specific notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Cookie', [`auth_token=${userAToken}`, ...csrfHeaders(userAId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Marked as read.');
    });

    it('returns 404 for a non-existent notification', async () => {
      const res = await request(app)
        .put('/api/notifications/999999/read')
        .set('Cookie', [`auth_token=${userAToken}`, ...csrfHeaders(userAId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when trying to mark another user\'s notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Cookie', [`auth_token=${userBToken}`, ...csrfHeaders(userBId).Cookie])
        .set('x-csrf-token', csrfToken);

      // userB does not own this notification, so update affects 0 rows → 404
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/notifications/:id ───────────────────────────────────────

  describe('DELETE /api/notifications/:id', () => {
    let notifId;

    beforeAll(async () => {
      const notif = await Notification.create({
        userId: userAId,
        type: 'new_follower',
        title: 'You have a new follower',
        isRead: false
      });
      notifId = notif.id;
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).delete(`/api/notifications/${notifId}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when trying to delete another user\'s notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifId}`)
        .set('Cookie', [`auth_token=${userBToken}`, ...csrfHeaders(userBId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('deletes the notification when authenticated as the owner with CSRF', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifId}`)
        .set('Cookie', [`auth_token=${userAToken}`, ...csrfHeaders(userAId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification deleted.');
    });

    it('returns 404 for a non-existent notification', async () => {
      const res = await request(app)
        .delete('/api/notifications/999999')
        .set('Cookie', [`auth_token=${userAToken}`, ...csrfHeaders(userAId).Cookie])
        .set('x-csrf-token', csrfToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
