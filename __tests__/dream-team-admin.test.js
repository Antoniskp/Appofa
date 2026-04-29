/**
 * Tests for Dream Team admin positions API with country-code filtering.
 */
const request = require('supertest');
const express = require('express');
const { sequelize, User, GovernmentPosition } = require('../src/models');
const adminRoutes = require('../src/routes/adminRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Dream Team Admin — adminGetPositions', () => {
  let adminToken;

  const csrfToken = 'test-csrf-dream-team-admin';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    await User.create({
      username: 'dtadmin',
      email: 'dtadmin@test.com',
      password: 'adminpass123',
      role: 'admin',
      firstNameNative: 'DT',
      lastNameNative: 'Admin',
    });

    const loginApp = express();
    loginApp.use(express.json());
    const authRoutes = require('../src/routes/authRoutes');
    loginApp.use('/api/auth', authRoutes);

    const loginRes = await request(loginApp)
      .post('/api/auth/login')
      .send({ email: 'dtadmin@test.com', password: 'adminpass123' });

    const adminCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
    adminToken = adminCookie?.split(';')[0].replace('auth_token=', '');

    const adminUser = await User.findOne({ where: { email: 'dtadmin@test.com' } });
    storeCsrfToken(csrfToken, adminUser.id);

    // Seed test positions for GR and CY
    await GovernmentPosition.bulkCreate([
      { slug: 'prothypoyrgos-test',       title: 'Πρωθυπουργός',           titleEn: 'Prime Minister',         positionTypeKey: 'prime_minister', scope: 'national', countryCode: 'GR', order: 1, isActive: true },
      { slug: 'cy-proedros-test',          title: 'Πρόεδρος Κύπρου',        titleEn: 'President of Cyprus',    positionTypeKey: 'head_of_state',  scope: 'national', countryCode: 'CY', order: 1, isActive: true },
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns all positions when no countryCode filter is given', async () => {
    const res = await request(app)
      .get('/api/admin/dream-team/positions')
      .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const slugs = res.body.data.map((p) => p.slug);
    expect(slugs).toContain('prothypoyrgos-test');
    expect(slugs).toContain('cy-proedros-test');
  });

  test('returns only GR positions when countryCode=GR', async () => {
    const res = await request(app)
      .get('/api/admin/dream-team/positions?countryCode=GR')
      .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const codes = [...new Set(res.body.data.map((p) => p.countryCode))];
    expect(codes).toEqual(['GR']);
    expect(res.body.data.map((p) => p.slug)).toContain('prothypoyrgos-test');
    expect(res.body.data.map((p) => p.slug)).not.toContain('cy-proedros-test');
  });

  test('returns only CY positions when countryCode=CY', async () => {
    const res = await request(app)
      .get('/api/admin/dream-team/positions?countryCode=CY')
      .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const codes = [...new Set(res.body.data.map((p) => p.countryCode))];
    expect(codes).toEqual(['CY']);
    expect(res.body.data.map((p) => p.slug)).toContain('cy-proedros-test');
    expect(res.body.data.map((p) => p.slug)).not.toContain('prothypoyrgos-test');
  });

  test('is case-insensitive — countryCode=gr returns GR positions', async () => {
    const res = await request(app)
      .get('/api/admin/dream-team/positions?countryCode=gr')
      .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    const codes = [...new Set(res.body.data.map((p) => p.countryCode))];
    expect(codes).toEqual(['GR']);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/admin/dream-team/positions');
    expect(res.status).toBe(401);
  });
});
