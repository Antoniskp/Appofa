const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize, User, VideoPin } = require('../src/models');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { storeCsrfToken } = require('../src/utils/csrf');
const authRoutes = require('../src/routes/authRoutes');
const videoPinRoutes = require('../src/routes/videoPinRoutes');
const {
  normalizeLiveExpiry,
  DEFAULT_LIVE_EXPIRY_HOURS,
  MAX_LIVE_EXPIRY_HOURS
} = require('../src/services/videoPinService');

process.env.JWT_SECRET = 'test-jwt-secret-video-pins';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/video-pins', videoPinRoutes);

function csrfHeadersFor(token, userId) {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token
  };
}

async function registerAndLogin(username, role = 'viewer') {
  await User.create({
    username,
    email: `${username}@test.com`,
    password: 'Test1234!',
    role
  });
  const user = await User.findOne({ where: { username } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

function mockTikTokOEmbed({ videoId = '1234567890123456789', title = 'Creator clip from the square', author = 'Map Creator', handle = 'mapcreator' } = {}) {
  const https = require('https');
  const originalGet = https.get;

  https.get = (_url, _opts, callback) => {
    const isCallback = typeof _opts === 'function' ? _opts : callback;
    const mockRes = {
      statusCode: 200,
      headers: {},
      on: (event, handler) => {
        if (event === 'data') handler(JSON.stringify({
          title,
          author_name: author,
          thumbnail_url: `https://p16.tiktokcdn.com/${videoId}.jpg`,
          provider_name: 'TikTok',
          provider_url: 'https://www.tiktok.com',
          html: `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${handle}/video/${videoId}" data-video-id="${videoId}"></blockquote>`
        }));
        if (event === 'end') handler();
        if (event === 'error') { /* noop */ }
        return mockRes;
      }
    };
    isCallback(mockRes);
    return { on: () => {}, setTimeout: () => {} };
  };

  return () => {
    https.get = originalGet;
  };
}

describe('video pin service helpers', () => {
  test('defaults live expiry to 24 hours', () => {
    const now = new Date('2026-08-02T10:00:00Z');
    const result = normalizeLiveExpiry('live', null, undefined, now);
    expect(result.value.toISOString()).toBe('2026-08-03T10:00:00.000Z');
    expect(DEFAULT_LIVE_EXPIRY_HOURS).toBe(24);
  });

  test('rejects unreasonable live expiry durations', () => {
    const result = normalizeLiveExpiry('live', null, MAX_LIVE_EXPIRY_HOURS + 1, new Date());
    expect(result.error).toMatch(/expiresInHours/);
  });
});

describe('Video pins API', () => {
  let viewerToken, viewerId;
  let adminToken, adminId;
  let pendingPinId;
  const viewerCsrf = 'csrf-video-pin-viewer';
  const adminCsrf = 'csrf-video-pin-admin';

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    ({ token: viewerToken, id: viewerId } = await registerAndLogin('video_pin_user', 'viewer'));
    ({ token: adminToken, id: adminId } = await registerAndLogin('video_pin_admin', 'admin'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('rejects unauthenticated create requests', async () => {
    const res = await request(app)
      .post('/api/video-pins')
      .send({
        sourceUrl: 'https://www.tiktok.com/@mapcreator/video/1234567890123456789',
        contentType: 'viral',
        category: 'events',
        lat: 37.98381,
        lng: 23.72754
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('creates a pending TikTok pin with creator metadata for regular users', async () => {
    const restoreHttps = mockTikTokOEmbed();

    try {
      const res = await request(app)
        .post('/api/video-pins')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeadersFor(viewerCsrf, viewerId))
        .send({
          sourceUrl: 'https://www.tiktok.com/@mapcreator/video/1234567890123456789',
          contentType: 'viral',
          category: 'events',
          lat: 37.98381,
          lng: 23.72754
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.videoPin).toMatchObject({
        status: 'pending',
        sourceProvider: 'tiktok',
        providerVideoId: '1234567890123456789',
        creatorHandle: '@mapcreator',
        creatorName: 'Map Creator',
        creatorUrl: 'https://www.tiktok.com/@mapcreator',
        title: 'Creator clip from the square',
        category: 'events',
        submittedByUserId: viewerId
      });
      pendingPinId = res.body.data.videoPin.id;
    } finally {
      restoreHttps();
    }
  });

  test('prevents duplicate provider video IDs', async () => {
    const restoreHttps = mockTikTokOEmbed();

    try {
      const res = await request(app)
        .post('/api/video-pins')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeadersFor(`${viewerCsrf}-duplicate`, viewerId))
        .send({
          sourceUrl: 'https://www.tiktok.com/@mapcreator/video/1234567890123456789',
          contentType: 'viral',
          category: 'events',
          lat: 38,
          lng: 24
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already pinned/);
    } finally {
      restoreHttps();
    }
  });

  test('hides pending pins from public listing and shows approved pins', async () => {
    const publicBefore = await request(app)
      .get('/api/video-pins')
      .expect(200);
    expect(publicBefore.body.data.videoPins.map((pin) => pin.id)).not.toContain(pendingPinId);

    const approved = await request(app)
      .put(`/api/video-pins/${pendingPinId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor(`${adminCsrf}-approve`, adminId))
      .send({ status: 'approved' });

    expect(approved.status).toBe(200);
    expect(approved.body.data.videoPin.status).toBe('approved');
    expect(approved.body.data.videoPin.moderatedByUserId).toBe(adminId);

    const publicAfter = await request(app)
      .get('/api/video-pins')
      .expect(200);
    expect(publicAfter.body.data.videoPins.map((pin) => pin.id)).toContain(pendingPinId);
  });

  test('filters by category and sorts live pins by expiration', async () => {
    const now = Date.now();
    const liveSoon = await VideoPin.create({
      contentType: 'live',
      category: 'traffic',
      status: 'approved',
      sourceProvider: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=soon123',
      canonicalUrl: 'https://www.youtube.com/watch?v=soon123',
      providerVideoId: 'soon123',
      title: 'Traffic live soon',
      lat: 38,
      lng: 24,
      expiresAt: new Date(now + 2 * 60 * 60 * 1000),
      submittedByUserId: adminId,
      moderatedByUserId: adminId,
      moderatedAt: new Date()
    });
    const liveLater = await VideoPin.create({
      contentType: 'live',
      category: 'traffic',
      status: 'approved',
      sourceProvider: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=later123',
      canonicalUrl: 'https://www.youtube.com/watch?v=later123',
      providerVideoId: 'later123',
      title: 'Traffic live later',
      lat: 38.1,
      lng: 24.1,
      expiresAt: new Date(now + 6 * 60 * 60 * 1000),
      submittedByUserId: adminId,
      moderatedByUserId: adminId,
      moderatedAt: new Date()
    });

    const res = await request(app)
      .get('/api/video-pins?contentType=live&category=traffic&sort=expiresSoon')
      .expect(200);

    const ids = res.body.data.videoPins.map((pin) => pin.id);
    expect(ids.indexOf(liveSoon.id)).toBeLessThan(ids.indexOf(liveLater.id));
    expect(res.body.data.videoPins.every((pin) => pin.category === 'traffic')).toBe(true);
  });

  test('hides expired live pins from public listing but exposes them to moderators with include=all', async () => {
    const expired = await VideoPin.create({
      contentType: 'live',
      category: 'weather',
      status: 'approved',
      sourceProvider: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=expired123',
      canonicalUrl: 'https://www.youtube.com/watch?v=expired123',
      providerVideoId: 'expired123',
      title: 'Expired weather live',
      lat: 39,
      lng: 25,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      submittedByUserId: adminId,
      moderatedByUserId: adminId,
      moderatedAt: new Date()
    });

    const publicRes = await request(app)
      .get('/api/video-pins?contentType=live')
      .expect(200);
    expect(publicRes.body.data.videoPins.map((pin) => pin.id)).not.toContain(expired.id);

    const moderatorRes = await request(app)
      .get('/api/video-pins?include=all&contentType=live')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Cookie', [`auth_token=${adminToken}`])
      .expect(200);
    const expiredPin = moderatorRes.body.data.videoPins.find((pin) => pin.id === expired.id);
    expect(expiredPin).toBeTruthy();
    expect(expiredPin.isExpired).toBe(true);
  });
});
