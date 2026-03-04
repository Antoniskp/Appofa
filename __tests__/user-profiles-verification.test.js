/**
 * Tests for enhanced user profiles and verification feature.
 */
const request = require('supertest');
const { sequelize, User, Location } = require('../src/models');

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

describe('Enhanced User Profiles and Verification', () => {
  let adminToken;
  let adminUserId;
  let moderatorToken;
  let moderatorUserId;
  let viewerToken;
  let viewerUserId;
  let outsiderToken;
  let outsiderUserId;
  let scopeLocationId;

  const csrfHeaderFor = (token) => ({
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  });

  const setCsrfToken = (token, userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(token, userId);
  };

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create a location for moderator scope
    const loc = await Location.create({
      name: 'Scope Location',
      type: 'municipality',
      slug: 'scope-location',
    });
    scopeLocationId = loc.id;

    // Create child location so moderator has something to manage
    const childLoc = await Location.create({
      name: 'Child Location',
      type: 'municipality',
      slug: 'child-location',
      parent_id: scopeLocationId,
    });

    // Admin user
    await User.create({ username: 'adminuser', email: 'admin@verify.test', password: 'pass123', role: 'admin' });
    const adminUser = await User.findOne({ where: { email: 'admin@verify.test' } });
    adminUserId = adminUser.id;
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@verify.test', password: 'pass123' });
    const adminCookie = adminLogin.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
    adminToken = adminCookie.split(';')[0].replace('auth_token=', '');

    // Moderator user (with homeLocationId = scopeLocationId)
    await User.create({ username: 'moduser', email: 'mod@verify.test', password: 'pass123', role: 'moderator', homeLocationId: scopeLocationId });
    const modUser = await User.findOne({ where: { email: 'mod@verify.test' } });
    moderatorUserId = modUser.id;
    const modLogin = await request(app).post('/api/auth/login').send({ email: 'mod@verify.test', password: 'pass123' });
    const modCookie = modLogin.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
    moderatorToken = modCookie.split(';')[0].replace('auth_token=', '');

    // Viewer inside moderator scope (homeLocationId = childLoc.id)
    await User.create({ username: 'viewerscope', email: 'viewer@verify.test', password: 'pass123', role: 'viewer', homeLocationId: childLoc.id });
    const viewerUser = await User.findOne({ where: { email: 'viewer@verify.test' } });
    viewerUserId = viewerUser.id;
    const viewerLogin = await request(app).post('/api/auth/login').send({ email: 'viewer@verify.test', password: 'pass123' });
    const viewerCookie = viewerLogin.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
    viewerToken = viewerCookie.split(';')[0].replace('auth_token=', '');

    // Outsider user (no homeLocation - outside moderator scope)
    await User.create({ username: 'outsider', email: 'outsider@verify.test', password: 'pass123', role: 'viewer', homeLocationId: null });
    const outsiderUser = await User.findOne({ where: { email: 'outsider@verify.test' } });
    outsiderUserId = outsiderUser.id;
    const outsiderLogin = await request(app).post('/api/auth/login').send({ email: 'outsider@verify.test', password: 'pass123' });
    const outsiderCookie = outsiderLogin.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
    outsiderToken = outsiderCookie.split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Profile update: new fields (mobileTel, bio, socialLinks)', () => {
    test('should accept and persist mobileTel, bio, and socialLinks', async () => {
      const csrf = 'csrf-profile-new-fields';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({
          mobileTel: '+30 210 0000000',
          bio: 'Hello world!',
          socialLinks: { github: 'https://github.com/testuser', website: 'https://example.com' },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobileTel).toBe('+30 210 0000000');
      expect(res.body.data.user.bio).toBe('Hello world!');
      expect(res.body.data.user.socialLinks).toMatchObject({ github: 'https://github.com/testuser', website: 'https://example.com' });
    });

    test('should reject bio over 280 characters', async () => {
      const csrf = 'csrf-profile-bio-too-long';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ bio: 'A'.repeat(281) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject mobileTel over 30 characters', async () => {
      const csrf = 'csrf-profile-tel-too-long';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ mobileTel: '1'.repeat(31) });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject unknown social link keys', async () => {
      const csrf = 'csrf-profile-bad-social';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ socialLinks: { unknownsite: 'https://unknown.com' } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject non-http social link URLs', async () => {
      const csrf = 'csrf-profile-bad-url';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ socialLinks: { github: 'ftp://github.com/user' } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Public profile: includes bio, socialLinks, isVerified; excludes mobileTel', () => {
    beforeAll(async () => {
      // Set bio, socialLinks on admin user
      const adminUser = await User.findByPk(adminUserId);
      adminUser.bio = 'My bio';
      adminUser.socialLinks = { github: 'https://github.com/admin' };
      adminUser.mobileTel = '+30 211 9999999';
      adminUser.searchable = true;
      await adminUser.save();
    });

    test('GET /users/:id/public includes bio, socialLinks, isVerified, excludes mobileTel', async () => {
      const res = await request(app)
        .get(`/api/auth/users/${adminUserId}/public`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.bio).toBe('My bio');
      expect(res.body.data.user.socialLinks).toMatchObject({ github: 'https://github.com/admin' });
      expect(res.body.data.user).toHaveProperty('isVerified');
      expect(res.body.data.user.mobileTel).toBeUndefined();
    });

    test('GET /users/username/:username/public includes bio, socialLinks, isVerified, excludes mobileTel', async () => {
      const adminUser = await User.findByPk(adminUserId);
      const res = await request(app)
        .get(`/api/auth/users/username/${adminUser.username}/public`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.bio).toBe('My bio');
      expect(res.body.data.user.socialLinks).toMatchObject({ github: 'https://github.com/admin' });
      expect(res.body.data.user).toHaveProperty('isVerified');
      expect(res.body.data.user.mobileTel).toBeUndefined();
    });
  });

  describe('Verification endpoint permissions', () => {
    test('admin can verify any user', async () => {
      const csrf = 'csrf-verify-admin';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isVerified).toBe(true);
      expect(res.body.data.user.verifiedAt).toBeTruthy();
      expect(res.body.data.user.verifiedByUserId).toBe(adminUserId);
    });

    test('admin can unverify a user', async () => {
      const csrf = 'csrf-unverify-admin';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isVerified).toBe(false);
      expect(res.body.data.user.verifiedAt).toBeNull();
    });

    test('moderator can verify in-scope user', async () => {
      const csrf = 'csrf-verify-mod-inscope';
      setCsrfToken(csrf, moderatorUserId);
      const res = await request(app)
        .put(`/api/auth/users/${viewerUserId}/verify`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isVerified).toBe(true);
    });

    test('moderator cannot verify out-of-scope user', async () => {
      const csrf = 'csrf-verify-mod-outscope';
      setCsrfToken(csrf, moderatorUserId);
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: true });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('viewer cannot access verify endpoint', async () => {
      const csrf = 'csrf-verify-viewer';
      setCsrfToken(csrf, viewerUserId);
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: true });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('verify endpoint requires CSRF token', async () => {
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isVerified: true });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid CSRF token.');
    });

    test('verify endpoint rejects non-boolean isVerified', async () => {
      const csrf = 'csrf-verify-bad-payload';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put(`/api/auth/users/${outsiderUserId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: 'yes' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('verify endpoint returns 404 for unknown user', async () => {
      const csrf = 'csrf-verify-notfound';
      setCsrfToken(csrf, adminUserId);
      const res = await request(app)
        .put('/api/auth/users/999999/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeaderFor(csrf))
        .send({ isVerified: true });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/users includes isVerified', () => {
    test('admin GET /users returns isVerified for each user', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const users = res.body.data.users;
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      users.forEach((u) => {
        expect(u).toHaveProperty('isVerified');
      });
    });

    test('admin GET /users does not include password or tokens', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const users = res.body.data.users;
      users.forEach((u) => {
        expect(u.password).toBeUndefined();
        expect(u.resetPasswordToken).toBeUndefined();
        expect(u.emailVerificationToken).toBeUndefined();
      });
    });

    test('moderator GET /users returns isVerified for in-scope users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${moderatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const users = res.body.data.users;
      expect(Array.isArray(users)).toBe(true);
      users.forEach((u) => {
        expect(u).toHaveProperty('isVerified');
      });
    });
  });
});
