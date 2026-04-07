/**
 * Hero Settings API Tests
 *
 * Tests cover:
 *  - GET /api/hero-settings/slides (public and admin views)
 *  - POST /api/hero-settings/slides (create)
 *  - PATCH /api/hero-settings/slides/reorder (reorder — the regression target)
 *  - PATCH /api/hero-settings/slides/:id/toggle
 *  - DELETE /api/hero-settings/slides/:id
 *  - Auth / role guards
 */

const request = require('supertest');
const { sequelize, User } = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const heroSettingsRoutes = require('../src/routes/heroSettingsRoutes');

process.env.JWT_SECRET = 'test-jwt-secret-hero-settings';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/hero-settings', heroSettingsRoutes);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { storeCsrfToken } = require('../src/utils/csrf');

function csrfHeadersFor(token, userId) {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  };
}

async function registerAndLogin(username, role = 'viewer') {
  await User.create({
    username,
    email: `${username}@test.com`,
    password: 'Test1234!',
    role,
    firstNameNative: username,
    lastNameNative: 'Test',
  });
  const user = await User.findOne({ where: { username } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Hero Settings API Tests', () => {
  let adminToken, adminId;
  let viewerToken, viewerId;

  const csrfAdmin = 'csrf-hero-admin';
  const csrfViewer = 'csrf-hero-viewer';

  let slideAId, slideBId, slideCId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    ({ token: adminToken, id: adminId } = await registerAndLogin('hero_admin', 'admin'));
    ({ token: viewerToken, id: viewerId } = await registerAndLogin('hero_viewer', 'viewer'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ─── GET /api/hero-settings/slides ──────────────────────────────────────────

  describe('GET /api/hero-settings/slides', () => {
    it('should return the default slide for unauthenticated users (only active)', async () => {
      const res = await request(app).get('/api/hero-settings/slides');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return all slides (including inactive) for admin', async () => {
      const res = await request(app)
        .get('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── POST /api/hero-settings/slides ─────────────────────────────────────────

  describe('POST /api/hero-settings/slides', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .send({ title: 'Test', subtitle: 'Sub' });
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeadersFor(csrfViewer, viewerId))
        .send({ title: 'Test', subtitle: 'Sub' });
      expect(res.status).toBe(403);
    });

    it('should reject missing title', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ subtitle: 'Sub' });
      expect(res.status).toBe(400);
    });

    it('should create slide A', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ title: 'Slide A', subtitle: 'Subtitle A' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const created = res.body.data.find((s) => s.title === 'Slide A');
      expect(created).toBeDefined();
      slideAId = created.id;
    });

    it('should create slide B', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ title: 'Slide B', subtitle: 'Subtitle B' });
      expect(res.status).toBe(201);
      const created = res.body.data.find((s) => s.title === 'Slide B');
      slideBId = created.id;
    });

    it('should create slide C', async () => {
      const res = await request(app)
        .post('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ title: 'Slide C', subtitle: 'Subtitle C' });
      expect(res.status).toBe(201);
      const created = res.body.data.find((s) => s.title === 'Slide C');
      slideCId = created.id;
    });
  });

  // ─── PATCH /api/hero-settings/slides/reorder ─────────────────────────────────

  describe('PATCH /api/hero-settings/slides/reorder', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .send({ ids: [slideAId, slideBId, slideCId] });
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set(csrfHeadersFor(csrfViewer, viewerId))
        .send({ ids: [slideAId, slideBId, slideCId] });
      expect(res.status).toBe(403);
    });

    it('should reject missing ids', async () => {
      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject duplicate ids', async () => {
      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ ids: [slideAId, slideAId, slideBId] });
      expect(res.status).toBe(400);
    });

    it('should reject ids that do not include every existing slide', async () => {
      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ ids: [slideAId, slideBId] }); // missing slideC and default slide
      expect(res.status).toBe(400);
    });

    it('should reorder slides and return the full saved array in new order', async () => {
      // Get the current full list first so we can include the default slide
      const getRes = await request(app)
        .get('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`);
      const allIds = getRes.body.data.map((s) => s.id);

      // Move slide C before slide A (reverse the A,B,C portion)
      // Build new order: default slide stays, then C, B, A
      const withoutCustom = allIds.filter((id) => id !== slideAId && id !== slideBId && id !== slideCId);
      const newOrder = [...withoutCustom, slideCId, slideBId, slideAId];

      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ ids: newOrder });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify the returned order matches what we sent
      const returnedIds = res.body.data.map((s) => s.id);
      expect(returnedIds).toEqual(newOrder);
    });

    it('should persist the reordered state on subsequent GET', async () => {
      const getRes = await request(app)
        .get('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(200);
      const ids = getRes.body.data.map((s) => s.id);
      // The last three should be C, B, A
      const last3 = ids.slice(-3);
      expect(last3).toEqual([slideCId, slideBId, slideAId]);
    });

    it('should allow moving a single slide up (swap adjacent)', async () => {
      // Current tail order: ..., C, B, A
      // Move A up one position → ..., C, A, B
      const getRes = await request(app)
        .get('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`);
      const current = getRes.body.data.map((s) => s.id);

      const aIdx = current.indexOf(slideAId);
      const reordered = [...current];
      [reordered[aIdx], reordered[aIdx - 1]] = [reordered[aIdx - 1], reordered[aIdx]];

      const res = await request(app)
        .patch('/api/hero-settings/slides/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId))
        .send({ ids: reordered });

      expect(res.status).toBe(200);
      expect(res.body.data.map((s) => s.id)).toEqual(reordered);
    });
  });

  // ─── PATCH /api/hero-settings/slides/:id/toggle ──────────────────────────────

  describe('PATCH /api/hero-settings/slides/:id/toggle', () => {
    it('should toggle a slide active state', async () => {
      const getRes = await request(app)
        .get('/api/hero-settings/slides')
        .set('Authorization', `Bearer ${adminToken}`);
      const slide = getRes.body.data.find((s) => s.id === slideAId);
      const originalActive = slide.isActive;

      const res = await request(app)
        .patch(`/api/hero-settings/slides/${slideAId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const toggled = res.body.data.find((s) => s.id === slideAId);
      expect(toggled.isActive).toBe(!originalActive);
    });
  });

  // ─── DELETE /api/hero-settings/slides/:id ────────────────────────────────────

  describe('DELETE /api/hero-settings/slides/:id', () => {
    it('should delete a slide and return updated list', async () => {
      const res = await request(app)
        .delete(`/api/hero-settings/slides/${slideCId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.find((s) => s.id === slideCId)).toBeUndefined();
    });

    it('should return 404 for already-deleted slide', async () => {
      const res = await request(app)
        .delete(`/api/hero-settings/slides/${slideCId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set(csrfHeadersFor(csrfAdmin, adminId));

      expect(res.status).toBe(404);
    });
  });
});
