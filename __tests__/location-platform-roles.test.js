/**
 * Tests for /api/locations/:locationId/platform-roles endpoints:
 *
 * 1.  List assignments for a location — returns only exact-location records
 * 2.  Add an assignment — success path
 * 3.  Add an assignment — duplicate prevention (409)
 * 4.  Add an assignment — validation: invalid roleKey (400)
 * 5.  Add an assignment — ancestor-chain validation: valid ancestor
 * 6.  Add an assignment — ancestor-chain validation: unrelated location rejected (400)
 * 7.  Add an assignment — no homeLocationId (400)
 * 8.  Add an assignment — auto-sets user's global role to 'moderator'
 * 9.  Remove an assignment — success, single removal
 * 10. Remove last assignment — user's global role downgraded to 'viewer'
 * 11. Remove assignment — 404 when not found
 * 12. Non-admin cannot access list endpoint (403)
 * 13. Non-admin cannot add assignment (403)
 * 14. Non-admin cannot remove assignment (403)
 * 15. Exact-only display: list returns only records for that location, not parents/children
 */
const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, UserLocationRole } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Location platform-roles endpoints', () => {
  let adminToken;
  let adminUserId;

  const makeCsrf = () => {
    const token = `csrf-plr-${Date.now()}-${Math.random()}`;
    storeCsrfToken(token, adminUserId);
    return token;
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const admin = await User.create({
      username: 'plr_admin',
      email: 'plr_admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    adminUserId = admin.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'plr_admin@test.com', password: 'password123' });
    adminToken = login.headers['set-cookie']
      .find((c) => c.startsWith('auth_token='))
      .split(';')[0]
      .replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // 1. List assignments
  // ---------------------------------------------------------------------------
  describe('1. GET /:locationId/platform-roles', () => {
    it('returns empty list when no assignments exist', async () => {
      const loc = await Location.create({ name: 'PLR Country A', slug: 'plr-country-a', type: 'country' });
      const csrf = makeCsrf();
      const res = await request(app)
        .get(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assignments)).toBe(true);
      expect(res.body.assignments).toHaveLength(0);
    });

    it('returns assignments for a location with assigned moderators', async () => {
      const loc = await Location.create({ name: 'PLR Country B', slug: 'plr-country-b', type: 'country' });
      const user = await User.create({ username: 'plr_mod1', email: 'plr_mod1@test.com', password: 'pw123', role: 'moderator', homeLocationId: loc.id });
      await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      const res = await request(app)
        .get(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assignments).toHaveLength(1);
      expect(res.body.assignments[0].userId).toBe(user.id);
      expect(res.body.assignments[0].roleKey).toBe('moderator');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Add assignment — success
  // ---------------------------------------------------------------------------
  describe('2. POST /:locationId/platform-roles — add assignment', () => {
    it('adds a moderator assignment for a user whose home is that location', async () => {
      const loc = await Location.create({ name: 'PLR Country C', slug: 'plr-country-c', type: 'country' });
      const user = await User.create({ username: 'plr_viewer1', email: 'plr_viewer1@test.com', password: 'pw123', role: 'viewer', homeLocationId: loc.id });

      const csrf = makeCsrf();
      const res = await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.assignment.userId).toBe(user.id);
      expect(res.body.assignment.roleKey).toBe('moderator');

      // Verify DB record
      const record = await UserLocationRole.findOne({ where: { userId: user.id, locationId: loc.id, roleKey: 'moderator' } });
      expect(record).not.toBeNull();
    });

    it('adds a moderator assignment for ancestor location of home', async () => {
      const country = await Location.create({ name: 'PLR Country D', slug: 'plr-country-d', type: 'country' });
      const muni = await Location.create({ name: 'PLR Muni D', slug: 'plr-muni-d', type: 'municipality', parent_id: country.id });
      const user = await User.create({ username: 'plr_viewer2', email: 'plr_viewer2@test.com', password: 'pw123', role: 'viewer', homeLocationId: muni.id });

      const csrf = makeCsrf();
      // Assign to country (ancestor of municipality home)
      const res = await request(app)
        .post(`/api/locations/${country.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Duplicate prevention
  // ---------------------------------------------------------------------------
  describe('3. Duplicate prevention (409)', () => {
    it('returns 409 when same assignment already exists', async () => {
      const loc = await Location.create({ name: 'PLR Country E', slug: 'plr-country-e', type: 'country' });
      const user = await User.create({ username: 'plr_dup1', email: 'plr_dup1@test.com', password: 'pw123', role: 'moderator', homeLocationId: loc.id });
      await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      const res = await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Invalid roleKey
  // ---------------------------------------------------------------------------
  describe('4. Validation — invalid roleKey', () => {
    it('returns 400 for unknown roleKey', async () => {
      const loc = await Location.create({ name: 'PLR Country F', slug: 'plr-country-f', type: 'country' });
      const user = await User.create({ username: 'plr_ik1', email: 'plr_ik1@test.com', password: 'pw123', role: 'viewer', homeLocationId: loc.id });

      const csrf = makeCsrf();
      const res = await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'superuser' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 5 & 6. Ancestor-chain validation
  // ---------------------------------------------------------------------------
  describe('5–6. Ancestor-chain validation', () => {
    it('rejects assignment when location is unrelated to user home', async () => {
      const country = await Location.create({ name: 'PLR Greece AC', slug: 'plr-greece-ac', type: 'country' });
      const crete = await Location.create({ name: 'PLR Crete AC', slug: 'plr-crete-ac', type: 'prefecture', parent_id: country.id });
      const attica = await Location.create({ name: 'PLR Attica AC', slug: 'plr-attica-ac', type: 'prefecture', parent_id: country.id });
      const athens = await Location.create({ name: 'PLR Athens AC', slug: 'plr-athens-ac', type: 'municipality', parent_id: attica.id });
      const user = await User.create({ username: 'plr_ac1', email: 'plr_ac1@test.com', password: 'pw123', role: 'viewer', homeLocationId: athens.id });

      const csrf = makeCsrf();
      // Try to assign as moderator of Crete (not in Athens ancestor chain)
      const res = await request(app)
        .post(`/api/locations/${crete.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/ancestor/i);
    });

    it('accepts assignment for valid ancestor location', async () => {
      const country = await Location.create({ name: 'PLR Greece OK', slug: 'plr-greece-ok', type: 'country' });
      const muni = await Location.create({ name: 'PLR Athens OK', slug: 'plr-athens-ok', type: 'municipality', parent_id: country.id });
      const user = await User.create({ username: 'plr_ok1', email: 'plr_ok1@test.com', password: 'pw123', role: 'viewer', homeLocationId: muni.id });

      const csrf = makeCsrf();
      const res = await request(app)
        .post(`/api/locations/${country.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. No homeLocationId
  // ---------------------------------------------------------------------------
  describe('7. User with no homeLocationId', () => {
    it('returns 400 when user has no homeLocationId', async () => {
      const loc = await Location.create({ name: 'PLR Country G', slug: 'plr-country-g', type: 'country' });
      const user = await User.create({ username: 'plr_nohome', email: 'plr_nohome@test.com', password: 'pw123', role: 'viewer' });

      const csrf = makeCsrf();
      const res = await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/home location/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Auto-sets global role to 'moderator'
  // ---------------------------------------------------------------------------
  describe('8. Auto-elevation of global role', () => {
    it('sets user.role to moderator when adding first moderator assignment', async () => {
      const loc = await Location.create({ name: 'PLR Country H', slug: 'plr-country-h', type: 'country' });
      const user = await User.create({ username: 'plr_elevate', email: 'plr_elevate@test.com', password: 'pw123', role: 'viewer', homeLocationId: loc.id });

      const csrf = makeCsrf();
      await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: user.id, roleKey: 'moderator' })
        .expect(201);

      await user.reload();
      expect(user.role).toBe('moderator');
    });

    it('does not downgrade admin role when adding moderator assignment', async () => {
      const loc = await Location.create({ name: 'PLR Country I', slug: 'plr-country-i', type: 'country' });
      const adminUser = await User.create({ username: 'plr_admin2', email: 'plr_admin2@test.com', password: 'pw123', role: 'admin', homeLocationId: loc.id });

      const csrf = makeCsrf();
      await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: adminUser.id, roleKey: 'moderator' })
        .expect(201);

      await adminUser.reload();
      // Admin should stay admin
      expect(adminUser.role).toBe('admin');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Remove assignment — success
  // ---------------------------------------------------------------------------
  describe('9. DELETE /:locationId/platform-roles/:id — remove', () => {
    it('removes one assignment successfully', async () => {
      const loc = await Location.create({ name: 'PLR Country J', slug: 'plr-country-j', type: 'country' });
      const user = await User.create({ username: 'plr_rm1', email: 'plr_rm1@test.com', password: 'pw123', role: 'moderator', homeLocationId: loc.id });
      const assignment = await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      const res = await request(app)
        .delete(`/api/locations/${loc.id}/platform-roles/${assignment.id}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify DB deletion
      const found = await UserLocationRole.findByPk(assignment.id);
      expect(found).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Remove last assignment — role downgrade
  // ---------------------------------------------------------------------------
  describe('10. Remove last assignment — role downgrade', () => {
    it('downgrades user.role to viewer when last moderator assignment is removed', async () => {
      const loc = await Location.create({ name: 'PLR Country K', slug: 'plr-country-k', type: 'country' });
      const user = await User.create({ username: 'plr_last', email: 'plr_last@test.com', password: 'pw123', role: 'moderator', homeLocationId: loc.id });
      const assignment = await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      await request(app)
        .delete(`/api/locations/${loc.id}/platform-roles/${assignment.id}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);

      await user.reload();
      expect(user.role).toBe('viewer');
    });

    it('keeps user.role as moderator when other assignments remain', async () => {
      const country = await Location.create({ name: 'PLR Country L', slug: 'plr-country-l', type: 'country' });
      const muni = await Location.create({ name: 'PLR Muni L', slug: 'plr-muni-l', type: 'municipality', parent_id: country.id });
      const user = await User.create({ username: 'plr_multi', email: 'plr_multi@test.com', password: 'pw123', role: 'moderator', homeLocationId: muni.id });
      const a1 = await UserLocationRole.create({ userId: user.id, locationId: country.id, roleKey: 'moderator' });
      await UserLocationRole.create({ userId: user.id, locationId: muni.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      // Remove only one of two assignments
      await request(app)
        .delete(`/api/locations/${country.id}/platform-roles/${a1.id}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);

      await user.reload();
      // Still a moderator since second assignment remains
      expect(user.role).toBe('moderator');
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Remove — 404 when not found
  // ---------------------------------------------------------------------------
  describe('11. Remove — 404 for non-existent assignment', () => {
    it('returns 404 for non-existent assignment ID', async () => {
      const loc = await Location.create({ name: 'PLR Country M', slug: 'plr-country-m', type: 'country' });
      const csrf = makeCsrf();
      const res = await request(app)
        .delete(`/api/locations/${loc.id}/platform-roles/999999`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 12–14. Non-admin access control
  // ---------------------------------------------------------------------------
  describe('12–14. Access control — non-admin cannot manage platform roles', () => {
    let viewerToken;
    let viewerUserId;

    beforeAll(async () => {
      const viewer = await User.create({ username: 'plr_viewer_ac', email: 'plr_viewer_ac@test.com', password: 'password123', role: 'viewer' });
      viewerUserId = viewer.id;
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'plr_viewer_ac@test.com', password: 'password123' });
      viewerToken = login.headers['set-cookie']
        .find((c) => c.startsWith('auth_token='))
        .split(';')[0]
        .replace('auth_token=', '');
    });

    it('non-admin cannot list platform role assignments', async () => {
      const loc = await Location.create({ name: 'PLR Country N', slug: 'plr-country-n', type: 'country' });
      const csrf = `csrf-viewer-${Date.now()}`;
      storeCsrfToken(csrf, viewerUserId);
      await request(app)
        .get(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(403);
    });

    it('non-admin cannot add platform role assignment', async () => {
      const loc = await Location.create({ name: 'PLR Country O', slug: 'plr-country-o', type: 'country' });
      const csrf = `csrf-viewer-add-${Date.now()}`;
      storeCsrfToken(csrf, viewerUserId);
      await request(app)
        .post(`/api/locations/${loc.id}/platform-roles`)
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ userId: viewerUserId, roleKey: 'moderator' })
        .expect(403);
    });

    it('non-admin cannot remove platform role assignment', async () => {
      const loc = await Location.create({ name: 'PLR Country P', slug: 'plr-country-p', type: 'country' });
      const csrf = `csrf-viewer-del-${Date.now()}`;
      storeCsrfToken(csrf, viewerUserId);
      await request(app)
        .delete(`/api/locations/${loc.id}/platform-roles/1`)
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 15. Exact-only display — list returns only records for that location
  // ---------------------------------------------------------------------------
  describe('15. Exact-only display — no parent/child leakage', () => {
    it('does not include assignments from parent location in child location list', async () => {
      const country = await Location.create({ name: 'PLR Country Q', slug: 'plr-country-q', type: 'country' });
      const muni = await Location.create({ name: 'PLR Muni Q', slug: 'plr-muni-q', type: 'municipality', parent_id: country.id });
      const user = await User.create({ username: 'plr_exact1', email: 'plr_exact1@test.com', password: 'pw123', role: 'moderator', homeLocationId: muni.id });

      // Assign moderator to COUNTRY only
      await UserLocationRole.create({ userId: user.id, locationId: country.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      // Querying the MUNICIPALITY should return empty (no assignment there)
      const res = await request(app)
        .get(`/api/locations/${muni.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);

      expect(res.body.assignments).toHaveLength(0);
    });

    it('does not include assignments from child in parent list', async () => {
      const country = await Location.create({ name: 'PLR Country R', slug: 'plr-country-r', type: 'country' });
      const muni = await Location.create({ name: 'PLR Muni R', slug: 'plr-muni-r', type: 'municipality', parent_id: country.id });
      const user = await User.create({ username: 'plr_exact2', email: 'plr_exact2@test.com', password: 'pw123', role: 'moderator', homeLocationId: muni.id });

      // Assign moderator to MUNICIPALITY only
      await UserLocationRole.create({ userId: user.id, locationId: muni.id, roleKey: 'moderator' });

      const csrf = makeCsrf();
      // Querying the COUNTRY should return empty (no assignment there)
      const res = await request(app)
        .get(`/api/locations/${country.id}/platform-roles`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .expect(200);

      expect(res.body.assignments).toHaveLength(0);
    });
  });
});
