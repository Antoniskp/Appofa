/**
 * Moderator Assignment Tests
 *
 * Tests the separation of homeLocationId (where user lives) from
 * moderatorLocationId (where user moderates), ancestor-chain validation,
 * and exact-only moderator display on location pages.
 */

const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Moderator Assignment', () => {
  let adminToken;
  let adminUserId;
  let adminCsrfToken;

  const makeAdminHeaders = () => ({
    Cookie: [`auth_token=${adminToken}`, `csrf_token=${adminCsrfToken}`],
    'x-csrf-token': adminCsrfToken
  });

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const admin = await User.create({
      username: 'ma_admin',
      email: 'ma_admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    adminUserId = admin.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ma_admin@test.com', password: 'password123' });

    adminToken = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('auth_token='))
      .split(';')[0]
      .replace('auth_token=', '');
    adminCsrfToken = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('csrf_token='))
      .split(';')[0]
      .replace('csrf_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('homeLocationId and moderatorLocationId are independent', () => {
    it('assigning moderator role sets moderatorLocationId without changing homeLocationId', async () => {
      const country = await Location.create({ name: 'MA Country', slug: 'ma-country', type: 'country' });
      const city = await Location.create({ name: 'MA City', slug: 'ma-city', type: 'municipality', parent_id: country.id });

      const viewer = await User.create({
        username: 'ma_user1',
        email: 'ma_user1@test.com',
        password: 'password123',
        role: 'viewer',
        homeLocationId: city.id
      });

      const csrfToken = 'ma-assign-mod-1';
      storeCsrfToken(csrfToken, adminUserId);

      // Assign moderator of country (ancestor of home city)
      const response = await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('moderator');

      // Reload user from DB to verify fields
      const updated = await User.findByPk(viewer.id);
      expect(updated.role).toBe('moderator');
      expect(updated.moderatorLocationId).toBe(country.id); // moderator location set
      expect(updated.homeLocationId).toBe(city.id); // home location unchanged
    });

    it('removing moderator role clears moderatorLocationId', async () => {
      const loc = await Location.create({ name: 'MA Loc2', slug: 'ma-loc2', type: 'country' });

      const mod = await User.create({
        username: 'ma_user2',
        email: 'ma_user2@test.com',
        password: 'password123',
        role: 'moderator',
        homeLocationId: loc.id,
        moderatorLocationId: loc.id
      });

      const csrfToken = 'ma-remove-mod-2';
      storeCsrfToken(csrfToken, adminUserId);

      await request(app)
        .put(`/api/auth/users/${mod.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'viewer' })
        .expect(200);

      const updated = await User.findByPk(mod.id);
      expect(updated.role).toBe('viewer');
      expect(updated.moderatorLocationId).toBeNull(); // cleared on role removal
      expect(updated.homeLocationId).toBe(loc.id); // home location still unchanged
    });
  });

  describe('Ancestor-chain validation for moderator assignment', () => {
    it('allows assignment to user home location (exact match)', async () => {
      const country = await Location.create({ name: 'MA AC Country', slug: 'ma-ac-country', type: 'country' });
      const user = await User.create({
        username: 'ma_ac_user1',
        email: 'ma_ac_user1@test.com',
        password: 'password123',
        role: 'viewer',
        homeLocationId: country.id
      });

      const csrfToken = 'ma-ac-exact';
      storeCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('allows assignment to ancestor location of home location', async () => {
      const country = await Location.create({ name: 'MA AC Parent', slug: 'ma-ac-parent', type: 'country' });
      const prefecture = await Location.create({ name: 'MA AC Pref', slug: 'ma-ac-pref', type: 'prefecture', parent_id: country.id });
      const city = await Location.create({ name: 'MA AC City', slug: 'ma-ac-city', type: 'municipality', parent_id: prefecture.id });

      const user = await User.create({
        username: 'ma_ac_user2',
        email: 'ma_ac_user2@test.com',
        password: 'password123',
        role: 'viewer',
        homeLocationId: city.id
      });

      const csrfToken = 'ma-ac-ancestor';
      storeCsrfToken(csrfToken, adminUserId);

      // Assign moderator of country (grandparent of home city)
      const response = await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      const updated = await User.findByPk(user.id);
      expect(updated.moderatorLocationId).toBe(country.id);
      expect(updated.homeLocationId).toBe(city.id); // home unchanged
    });

    it('rejects assignment to unrelated location outside ancestor chain', async () => {
      const homeCountry = await Location.create({ name: 'MA AC Home', slug: 'ma-ac-home', type: 'country' });
      const unrelated = await Location.create({ name: 'MA AC Unrelated', slug: 'ma-ac-unrelated', type: 'country' });

      const user = await User.create({
        username: 'ma_ac_user3',
        email: 'ma_ac_user3@test.com',
        password: 'password123',
        role: 'viewer',
        homeLocationId: homeCountry.id
      });

      const csrfToken = 'ma-ac-unrelated';
      storeCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'moderator', locationId: unrelated.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/ancestor/i);

      // homeLocationId should remain unchanged
      const notUpdated = await User.findByPk(user.id);
      expect(notUpdated.moderatorLocationId).toBeNull();
      expect(notUpdated.homeLocationId).toBe(homeCountry.id);
    });

    it('allows assignment to any location when user has no homeLocationId', async () => {
      const loc = await Location.create({ name: 'MA AC No Home', slug: 'ma-ac-no-home', type: 'country' });

      const user = await User.create({
        username: 'ma_ac_user4',
        email: 'ma_ac_user4@test.com',
        password: 'password123',
        role: 'viewer',
        homeLocationId: null
      });

      const csrfToken = 'ma-ac-nohome';
      storeCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set(makeAdminHeaders())
        .set('x-csrf-token', csrfToken)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .send({ role: 'moderator', locationId: loc.id })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Exact-only moderator display on location pages', () => {
    it('shows moderator on their exact assigned location via moderatorLocationId', async () => {
      const loc = await Location.create({ name: 'MA Display Loc', slug: 'ma-display-loc', type: 'country' });

      await User.create({
        username: 'ma_disp_mod',
        email: 'ma_disp_mod@test.com',
        password: 'password123',
        role: 'moderator',
        homeLocationId: loc.id,
        moderatorLocationId: loc.id
      });

      const response = await request(app)
        .get(`/api/locations/${loc.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.hasModerator).toBe(true);
      expect(response.body.location.moderatorPreview).not.toBeNull();
    });

    it('does NOT show parent moderator on child location', async () => {
      const parent = await Location.create({ name: 'MA Parent Mod', slug: 'ma-parent-mod', type: 'country' });
      const child = await Location.create({ name: 'MA Child No Mod', slug: 'ma-child-no-mod', type: 'prefecture', parent_id: parent.id });

      // Moderator assigned to parent only
      await User.create({
        username: 'ma_parent_mod',
        email: 'ma_parent_mod@test.com',
        password: 'password123',
        role: 'moderator',
        homeLocationId: parent.id,
        moderatorLocationId: parent.id
      });

      // Parent should have a moderator
      const parentRes = await request(app).get(`/api/locations/${parent.id}`).expect(200);
      expect(parentRes.body.location.hasModerator).toBe(true);

      // Child should NOT inherit the parent moderator
      const childRes = await request(app).get(`/api/locations/${child.id}`).expect(200);
      expect(childRes.body.location.hasModerator).toBe(false);
      expect(childRes.body.location.moderatorPreview).toBeNull();
    });

    it('list and detail endpoints are consistent for moderator presence', async () => {
      const country = await Location.create({ name: 'MA Consist Country', slug: 'ma-consist-country', type: 'country' });
      const child = await Location.create({ name: 'MA Consist Child', slug: 'ma-consist-child', type: 'prefecture', parent_id: country.id });

      // Moderator assigned only to country, NOT to child
      await User.create({
        username: 'ma_consist_mod',
        email: 'ma_consist_mod@test.com',
        password: 'password123',
        role: 'moderator',
        homeLocationId: country.id,
        moderatorLocationId: country.id
      });

      const listRes = await request(app).get(`/api/locations?type=prefecture`).expect(200);
      const detailRes = await request(app).get(`/api/locations/${child.id}`).expect(200);

      const childInList = listRes.body.locations?.find((l) => l.id === child.id);
      const childInDetail = detailRes.body.location;

      // List and detail agree: child has no moderator
      expect(childInList?.hasModerator).toBe(false);
      expect(childInDetail.hasModerator).toBe(false);
      expect(childInList?.hasModerator).toBe(childInDetail.hasModerator);
    });
  });
});
