'use strict';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { corsOptions } = require('../src/config/securityHeaders');
const authRoutes = require('../src/routes/authRoutes');
const locationRoutes = require('../src/routes/locationRoutes');
const { sequelize, User, Location } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = 'test-jwt-secret-image-upload';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);

// Minimal valid 1×1 PNG buffer
const VALID_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

function csrfHeaders(token, userId) {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  };
}

async function createAndLogin(username, role = 'viewer') {
  const user = await User.create({
    username,
    email: `${username}@imagetest.com`,
    password: 'Test1234!',
    role,
    firstNameNative: username,
    lastNameNative: 'Test',
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@imagetest.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

describe('Image Upload API', () => {
  let viewerToken, viewerId;
  let adminToken, adminId;
  let moderatorToken, moderatorId;
  let testLocation;

  const uploadsProfiles = path.join(process.cwd(), 'uploads', 'profiles');
  const uploadsLocations = path.join(process.cwd(), 'uploads', 'locations');

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    ({ token: viewerToken, id: viewerId } = await createAndLogin('img_viewer', 'viewer'));
    ({ token: adminToken, id: adminId } = await createAndLogin('img_admin', 'admin'));
    ({ token: moderatorToken, id: moderatorId } = await createAndLogin('img_moderator', 'moderator'));
    testLocation = await Location.create({
      name: 'Test Location',
      type: 'country',
      slug: 'test-location-img',
      code: 'TL',
    });
  });

  afterAll(async () => {
    // Clean up uploaded test files
    [viewerId, adminId, moderatorId].forEach((id) => {
      const p = path.join(uploadsProfiles, `${id}.webp`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    const locPath = path.join(uploadsLocations, `${testLocation.id}.webp`);
    if (fs.existsSync(locPath)) fs.unlinkSync(locPath);
    await sequelize.close();
  });

  // ─── Avatar upload ────────────────────────────────────────────────────────

  describe('POST /api/auth/me/avatar', () => {
    test('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .attach('avatar', VALID_PNG, { filename: 'avatar.png', contentType: 'image/png' });
      expect(res.status).toBe(401);
    });

    test('rejects request without CSRF token', async () => {
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`])
        .attach('avatar', VALID_PNG, { filename: 'avatar.png', contentType: 'image/png' });
      expect(res.status).toBe(403);
    });

    test('rejects unsupported MIME type', async () => {
      const csrf = 'csrf-mime-test';
      storeCsrfToken(csrf, viewerId);
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('avatar', Buffer.from('fakedata'), { filename: 'test.gif', contentType: 'image/gif' });
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
    });

    test('rejects oversized file', async () => {
      const csrf = 'csrf-size-test';
      storeCsrfToken(csrf, viewerId);
      // Create a buffer > 5MB
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('avatar', bigBuffer, { filename: 'big.png', contentType: 'image/png' });
      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
    });

    test('rejects missing file', async () => {
      const csrf = 'csrf-nofile-test';
      storeCsrfToken(csrf, viewerId);
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('successfully uploads avatar and updates DB', async () => {
      const csrf = 'csrf-upload-ok';
      storeCsrfToken(csrf, viewerId);
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('avatar', VALID_PNG, { filename: 'avatar.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatarUrl).toMatch(/\/uploads\/profiles\//);
      // Response includes avatarUpdatedAt for cache-busting
      expect(res.body.data.avatarUpdatedAt).toBeTruthy();
      // Check DB was updated: avatarUrl persisted
      const user = await User.findByPk(viewerId);
      expect(user.avatarUrl).toBeTruthy();
      expect(user.avatarUpdatedAt).toBeTruthy();
      // Uploaded avatar is activated as the current avatar
      expect(user.avatar).toBe(user.avatarUrl);
      // Check file exists on disk
      const filePath = path.join(uploadsProfiles, `${viewerId}.webp`);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('re-upload overwrites previous file (single key)', async () => {
      const csrf = 'csrf-reupload';
      storeCsrfToken(csrf, viewerId);
      const res = await request(app)
        .post('/api/auth/me/avatar')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('avatar', VALID_PNG, { filename: 'avatar2.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toMatch(new RegExp(`/uploads/profiles/${viewerId}\\.webp`));
      // Only one file should exist
      const files = fs.readdirSync(uploadsProfiles).filter((f) => f.startsWith(`${viewerId}`));
      expect(files.length).toBe(1);
    });
  });

  // ─── Location image upload ─────────────────────────────────────────────────

  describe('POST /api/locations/:id/image', () => {
    test('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .attach('image', VALID_PNG, { filename: 'loc.png', contentType: 'image/png' });
      expect(res.status).toBe(401);
    });

    test('rejects viewer role', async () => {
      const csrf = 'csrf-loc-viewer';
      storeCsrfToken(csrf, viewerId);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', VALID_PNG, { filename: 'loc.png', contentType: 'image/png' });
      expect(res.status).toBe(403);
    });

    test('rejects unsupported MIME type', async () => {
      const csrf = 'csrf-loc-mime';
      storeCsrfToken(csrf, adminId);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', Buffer.from('fakedata'), { filename: 'test.bmp', contentType: 'image/bmp' });
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
    });

    test('rejects oversized file', async () => {
      const csrf = 'csrf-loc-size';
      storeCsrfToken(csrf, adminId);
      const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', bigBuffer, { filename: 'big.png', contentType: 'image/png' });
      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
    });

    test('returns 404 for non-existent location', async () => {
      const csrf = 'csrf-loc-404';
      storeCsrfToken(csrf, adminId);
      const res = await request(app)
        .post('/api/locations/99999/image')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', VALID_PNG, { filename: 'loc.png', contentType: 'image/png' });
      expect(res.status).toBe(404);
    });

    test('admin can successfully upload location image', async () => {
      const csrf = 'csrf-loc-upload-ok';
      storeCsrfToken(csrf, adminId);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', VALID_PNG, { filename: 'loc.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.imageUrl).toMatch(/\/uploads\/locations\//);
      // Response includes imageUpdatedAt for cache-busting
      expect(res.body.data.imageUpdatedAt).toBeTruthy();
      // Check DB was updated
      const loc = await Location.findByPk(testLocation.id);
      expect(loc.imageUrl).toBeTruthy();
      expect(loc.imageUpdatedAt).toBeTruthy();
      expect(loc.imageUpdatedBy).toBe(adminId);
      // Check file on disk
      const filePath = path.join(uploadsLocations, `${testLocation.id}.webp`);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('moderator can successfully upload location image', async () => {
      const csrf = 'csrf-loc-mod-ok';
      storeCsrfToken(csrf, moderatorId);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${moderatorToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', VALID_PNG, { filename: 'loc2.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('re-upload overwrites previous file (single key)', async () => {
      const csrf = 'csrf-loc-reupload';
      storeCsrfToken(csrf, adminId);
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/image`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .attach('image', VALID_PNG, { filename: 'loc3.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.imageUrl).toMatch(new RegExp(`/uploads/locations/${testLocation.id}\\.webp`));
      // Only one file should exist for this location
      const files = fs.readdirSync(uploadsLocations).filter((f) => f.startsWith(`${testLocation.id}`));
      expect(files.length).toBe(1);
    });
  });
});
