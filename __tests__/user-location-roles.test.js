/**
 * Tests for UserLocationRole join table:
 * - exact-only moderator display on location detail
 * - list/detail consistency for moderator presence
 * - assigning moderator role through the join table
 * - rejecting unrelated location assignments outside the home-location ancestor chain
 * - preserving homeLocationId when moderator/location role assignments change
 * - join-table support for multiple location-scoped role keys
 */
const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, UserLocationRole } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('UserLocationRole join table', () => {
  let adminToken;
  let adminUserId;
  let adminCsrfToken;

  const makeAdminCsrf = () => {
    const token = `csrf-ulr-${Date.now()}-${Math.random()}`;
    storeCsrfToken(token, adminUserId);
    return token;
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const admin = await User.create({
      username: 'ulr_admin',
      email: 'ulr_admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    adminUserId = admin.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ulr_admin@test.com', password: 'password123' });
    adminToken = login.headers['set-cookie']
      .find((c) => c.startsWith('auth_token='))
      .split(';')[0]
      .replace('auth_token=', '');
    adminCsrfToken = login.headers['set-cookie']
      .find((c) => c.startsWith('csrf_token='))
      .split(';')[0]
      .replace('csrf_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Exact-only moderator display on location detail
  // ---------------------------------------------------------------------------
  describe('1. Exact-only moderator display', () => {
    it('location detail shows moderator assigned to THAT exact location', async () => {
      const country = await Location.create({ name: 'ULR Country 1', slug: 'ulr-country-1', type: 'country' });
      const child = await Location.create({ name: 'ULR Child 1', slug: 'ulr-child-1', type: 'prefecture', parent_id: country.id });
      const mod = await User.create({ username: 'ulr_mod1', email: 'ulr_mod1@test.com', password: 'pw123', role: 'moderator', homeLocationId: child.id });
      await UserLocationRole.create({ userId: mod.id, locationId: child.id, roleKey: 'moderator' });

      const res = await request(app).get(`/api/locations/${child.id}`).expect(200);
      expect(res.body.location.hasModerator).toBe(true);
      expect(res.body.location.moderatorPreview.id).toBe(mod.id);
    });

    it('location detail does NOT inherit moderator from parent', async () => {
      const country = await Location.create({ name: 'ULR Country 2', slug: 'ulr-country-2', type: 'country' });
      const child = await Location.create({ name: 'ULR Child 2', slug: 'ulr-child-2', type: 'prefecture', parent_id: country.id });
      const parentMod = await User.create({ username: 'ulr_parentmod', email: 'ulr_parentmod@test.com', password: 'pw123', role: 'moderator', homeLocationId: country.id });
      // Assign only to parent
      await UserLocationRole.create({ userId: parentMod.id, locationId: country.id, roleKey: 'moderator' });

      const res = await request(app).get(`/api/locations/${child.id}`).expect(200);
      expect(res.body.location.hasModerator).toBe(false);
      expect(res.body.location.moderatorPreview).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. List/detail consistency
  // ---------------------------------------------------------------------------
  describe('2. List/detail consistency', () => {
    it('hasModerator matches between list and detail endpoints', async () => {
      const country = await Location.create({ name: 'ULR Consistency Country', slug: 'ulr-cons-country', type: 'country' });
      const child = await Location.create({ name: 'ULR Consistency Child', slug: 'ulr-cons-child', type: 'prefecture', parent_id: country.id });
      const mod = await User.create({ username: 'ulr_consmod', email: 'ulr_consmod@test.com', password: 'pw123', role: 'moderator', homeLocationId: country.id });
      await UserLocationRole.create({ userId: mod.id, locationId: country.id, roleKey: 'moderator' });

      const listRes = await request(app).get(`/api/locations?type=prefecture`).expect(200);
      const detailRes = await request(app).get(`/api/locations/${child.id}`).expect(200);

      const childInList = listRes.body.locations?.find((l) => l.id === child.id);
      expect(childInList?.hasModerator).toBe(detailRes.body.location.hasModerator);
      // Both should be false since child has no assignment
      expect(childInList?.hasModerator).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Assigning moderator role through the join table (via PUT /api/auth/users/:id/role)
  // ---------------------------------------------------------------------------
  describe('3. Assigning moderator role via API', () => {
    it('creates UserLocationRole record when assigning moderator role', async () => {
      const country = await Location.create({ name: 'ULR Assign Country', slug: 'ulr-assign-country', type: 'country' });
      const viewer = await User.create({ username: 'ulr_viewer', email: 'ulr_viewer@test.com', password: 'pw123', role: 'viewer', homeLocationId: country.id });

      const csrf = makeAdminCsrf();
      const res = await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify join table record was created
      const assignment = await UserLocationRole.findOne({ where: { userId: viewer.id, locationId: country.id, roleKey: 'moderator' } });
      expect(assignment).not.toBeNull();
    });

    it('does NOT modify homeLocationId when assigning moderator role', async () => {
      const country = await Location.create({ name: 'ULR Home Country', slug: 'ulr-home-country', type: 'country' });
      const municipality = await Location.create({ name: 'ULR Home Muni', slug: 'ulr-home-muni', type: 'municipality', parent_id: country.id });
      const viewer = await User.create({ username: 'ulr_hometest', email: 'ulr_hometest@test.com', password: 'pw123', role: 'viewer', homeLocationId: municipality.id });

      const originalHomeId = viewer.homeLocationId;

      const csrf = makeAdminCsrf();
      await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      const updated = await User.findByPk(viewer.id, { attributes: ['homeLocationId'] });
      // homeLocationId must remain unchanged
      expect(updated.homeLocationId).toBe(originalHomeId);
    });

    it('removes all moderator location assignments when demoting from moderator', async () => {
      const country = await Location.create({ name: 'ULR Demote Country', slug: 'ulr-demote-country', type: 'country' });
      const mod = await User.create({ username: 'ulr_demote', email: 'ulr_demote@test.com', password: 'pw123', role: 'moderator', homeLocationId: country.id });
      await UserLocationRole.create({ userId: mod.id, locationId: country.id, roleKey: 'moderator' });

      const csrf = makeAdminCsrf();
      await request(app)
        .put(`/api/auth/users/${mod.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'viewer' })
        .expect(200);

      const remaining = await UserLocationRole.findAll({ where: { userId: mod.id, roleKey: 'moderator' } });
      expect(remaining).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Rejecting unrelated location assignments outside ancestor chain
  // ---------------------------------------------------------------------------
  describe('4. Rejecting out-of-ancestor-chain assignments', () => {
    it('rejects moderator assignment to a location unrelated to user homeLocationId', async () => {
      const greeceCountry = await Location.create({ name: 'ULR Greece', slug: 'ulr-greece', type: 'country' });
      const attica = await Location.create({ name: 'ULR Attica', slug: 'ulr-attica', type: 'prefecture', parent_id: greeceCountry.id });
      const athens = await Location.create({ name: 'ULR Athens', slug: 'ulr-athens', type: 'municipality', parent_id: attica.id });
      const crete = await Location.create({ name: 'ULR Crete', slug: 'ulr-crete', type: 'prefecture', parent_id: greeceCountry.id });

      // User lives in Athens
      const viewer = await User.create({ username: 'ulr_athensuser', email: 'ulr_athens@test.com', password: 'pw123', role: 'viewer', homeLocationId: athens.id });

      const csrf = makeAdminCsrf();
      // Try to assign as moderator of Crete (not in Athens ancestry chain)
      const res = await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'moderator', locationId: crete.id })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ancestor');
    });

    it('allows moderator assignment to exact home location', async () => {
      const country = await Location.create({ name: 'ULR Allow Country', slug: 'ulr-allow-country', type: 'country' });
      const muni = await Location.create({ name: 'ULR Allow Muni', slug: 'ulr-allow-muni', type: 'municipality', parent_id: country.id });
      const viewer = await User.create({ username: 'ulr_allowhome', email: 'ulr_allowhome@test.com', password: 'pw123', role: 'viewer', homeLocationId: muni.id });

      const csrf = makeAdminCsrf();
      const res = await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'moderator', locationId: muni.id })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('allows moderator assignment to a parent of home location', async () => {
      const country = await Location.create({ name: 'ULR Parent Country', slug: 'ulr-parent-country', type: 'country' });
      const prefecture = await Location.create({ name: 'ULR Parent Pref', slug: 'ulr-parent-pref', type: 'prefecture', parent_id: country.id });
      const muni = await Location.create({ name: 'ULR Parent Muni', slug: 'ulr-parent-muni', type: 'municipality', parent_id: prefecture.id });
      const viewer = await User.create({ username: 'ulr_parentok', email: 'ulr_parentok@test.com', password: 'pw123', role: 'viewer', homeLocationId: muni.id });

      const csrf = makeAdminCsrf();
      // Assign as moderator of prefecture (ancestor of home)
      const res = await request(app)
        .put(`/api/auth/users/${viewer.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ role: 'moderator', locationId: prefecture.id })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. preserving homeLocationId when assignments change
  // ---------------------------------------------------------------------------
  describe('5. homeLocationId preserved across moderator assignment changes', () => {
    it('homeLocationId stays unchanged through multiple role changes', async () => {
      const country = await Location.create({ name: 'ULR Preserve Country', slug: 'ulr-preserve-country', type: 'country' });
      const pref = await Location.create({ name: 'ULR Preserve Pref', slug: 'ulr-preserve-pref', type: 'prefecture', parent_id: country.id });
      const muni = await Location.create({ name: 'ULR Preserve Muni', slug: 'ulr-preserve-muni', type: 'municipality', parent_id: pref.id });

      // User lives in municipality
      const user = await User.create({ username: 'ulr_preserve', email: 'ulr_preserve@test.com', password: 'pw123', role: 'viewer', homeLocationId: muni.id });
      const originalHomeId = user.homeLocationId;

      const csrf1 = makeAdminCsrf();
      // Assign as moderator of prefecture
      await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf1}`])
        .set('x-csrf-token', csrf1)
        .send({ role: 'moderator', locationId: pref.id })
        .expect(200);

      let updated = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
      expect(updated.homeLocationId).toBe(originalHomeId);

      const csrf2 = makeAdminCsrf();
      // Assign as moderator of country (another ancestor)
      await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf2}`])
        .set('x-csrf-token', csrf2)
        .send({ role: 'moderator', locationId: country.id })
        .expect(200);

      updated = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
      expect(updated.homeLocationId).toBe(originalHomeId);

      const csrf3 = makeAdminCsrf();
      // Demote back to viewer
      await request(app)
        .put(`/api/auth/users/${user.id}/role`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrf3}`])
        .set('x-csrf-token', csrf3)
        .send({ role: 'viewer' })
        .expect(200);

      updated = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
      expect(updated.homeLocationId).toBe(originalHomeId);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Join table supports multiple role keys
  // ---------------------------------------------------------------------------
  describe('6. Join table supports multiple role keys', () => {
    it('allows creating UserLocationRole records with different roleKeys for the same user+location', async () => {
      const loc = await Location.create({ name: 'ULR MultiRole Loc', slug: 'ulr-multirole-loc', type: 'country' });
      const user = await User.create({ username: 'ulr_multirole', email: 'ulr_multirole@test.com', password: 'pw123', role: 'viewer' });

      await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });
      await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'election_delegate' });

      const assignments = await UserLocationRole.findAll({ where: { userId: user.id, locationId: loc.id } });
      expect(assignments).toHaveLength(2);
      const keys = assignments.map((a) => a.roleKey).sort();
      expect(keys).toEqual(['election_delegate', 'moderator']);
    });

    it('enforces unique constraint on (userId, locationId, roleKey)', async () => {
      const loc = await Location.create({ name: 'ULR Unique Loc', slug: 'ulr-unique-loc', type: 'country' });
      const user = await User.create({ username: 'ulr_unique', email: 'ulr_unique@test.com', password: 'pw123', role: 'viewer' });

      await UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' });

      await expect(
        UserLocationRole.create({ userId: user.id, locationId: loc.id, roleKey: 'moderator' })
      ).rejects.toThrow();
    });

    it('allows the same roleKey at different locations for the same user', async () => {
      const loc1 = await Location.create({ name: 'ULR Multi Loc1', slug: 'ulr-multi-loc1', type: 'country' });
      const loc2 = await Location.create({ name: 'ULR Multi Loc2', slug: 'ulr-multi-loc2', type: 'country' });
      const user = await User.create({ username: 'ulr_multiloc', email: 'ulr_multiloc@test.com', password: 'pw123', role: 'moderator' });

      await UserLocationRole.create({ userId: user.id, locationId: loc1.id, roleKey: 'moderator' });
      await UserLocationRole.create({ userId: user.id, locationId: loc2.id, roleKey: 'moderator' });

      const assignments = await UserLocationRole.findAll({ where: { userId: user.id, roleKey: 'moderator' } });
      expect(assignments).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Moderator scope with multiple location assignments
  // ---------------------------------------------------------------------------
  describe('7. Moderator scope covers union of assigned location descendants', () => {
    let multiModerator;
    let multiModeratorToken;
    let locationA;
    let locationAChild;
    let locationB;
    let locationBChild;
    let outOfScopeLocation;

    beforeAll(async () => {
      locationA = await Location.create({ name: 'ULR ScopeA', slug: 'ulr-scope-a', type: 'country' });
      locationAChild = await Location.create({ name: 'ULR ScopeA Child', slug: 'ulr-scope-a-child', type: 'prefecture', parent_id: locationA.id });
      locationB = await Location.create({ name: 'ULR ScopeB', slug: 'ulr-scope-b', type: 'country' });
      locationBChild = await Location.create({ name: 'ULR ScopeB Child', slug: 'ulr-scope-b-child', type: 'prefecture', parent_id: locationB.id });
      outOfScopeLocation = await Location.create({ name: 'ULR OutOfScope', slug: 'ulr-out-of-scope', type: 'country' });

      multiModerator = await User.create({ username: 'ulr_multiscope', email: 'ulr_multiscope@test.com', password: 'password123', role: 'moderator', homeLocationId: locationA.id });
      await UserLocationRole.create({ userId: multiModerator.id, locationId: locationA.id, roleKey: 'moderator' });
      await UserLocationRole.create({ userId: multiModerator.id, locationId: locationB.id, roleKey: 'moderator' });

      const login = await request(app).post('/api/auth/login').send({ email: 'ulr_multiscope@test.com', password: 'password123' });
      multiModeratorToken = login.headers['set-cookie'].find((c) => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');
    });

    it('moderator can update a location in first assigned scope', async () => {
      const res = await request(app)
        .put(`/api/locations/${locationAChild.id}`)
        .set('Cookie', `auth_token=${multiModeratorToken}`)
        .send({ name: 'ULR ScopeA Child Updated' })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('moderator can update a location in second assigned scope', async () => {
      const res = await request(app)
        .put(`/api/locations/${locationBChild.id}`)
        .set('Cookie', `auth_token=${multiModeratorToken}`)
        .send({ name: 'ULR ScopeB Child Updated' })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('moderator cannot update a location outside all assigned scopes', async () => {
      const res = await request(app)
        .put(`/api/locations/${outOfScopeLocation.id}`)
        .set('Cookie', `auth_token=${multiModeratorToken}`)
        .send({ name: 'ULR Blocked Update' })
        .expect(403);
      expect(res.body.success).toBe(false);
    });
  });
});
