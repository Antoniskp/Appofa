const { sequelize, User, Location, UserLocationRole } = require('../src/models');
const service = require('../src/services/userService');

describe('Admin registered-user list and counts', () => {
  let admin, moderator, place;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    place = await Location.create({ name: 'Admin test country', slug: 'admin-test-country', type: 'country' });
    const child = await Location.create({ name: 'Admin test city', slug: 'admin-test-city', type: 'municipality', parent_id: place.id });
    admin = await User.create({ username: 'realadmin', email: 'realadmin@test.local', role: 'admin', homeLocationId: place.id });
    moderator = await User.create({ username: 'realmoderator', email: 'realmoderator@test.local', role: 'moderator', homeLocationId: place.id });
    await User.create({ username: 'realviewer', email: 'realviewer@test.local', role: 'viewer', homeLocationId: place.id });
    await User.create({ username: 'outsideviewer', email: 'outside@test.local', role: 'viewer' });
    for (const claimStatus of ['unclaimed', 'pending', 'claimed', 'rejected']) {
      await User.create({ username: `person${claimStatus}`, email: `${claimStatus}@placeholder.test`, claimStatus, homeLocationId: place.id });
    }
    await UserLocationRole.bulkCreate([
      { userId: moderator.id, locationId: place.id, roleKey: 'moderator' },
      { userId: moderator.id, locationId: child.id, roleKey: 'moderator' },
    ]);
  });
  afterAll(() => sequelize.close());
  test('defaults to registered accounts and counts each user once across role assignments', async () => {
    const result = await service.getAdminUsers(admin.id, 'admin', { limit: 2 });
    expect(result.pagination.totalItems).toBe(4);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.stats.total).toBe(4);
    expect(result.users.every(user => user.claimStatus === null)).toBe(true);
    expect((await service.getUserStats(admin.id, 'admin')).total).toBe(4);
  });
  test('explicit person and all filters preserve access with matching statistics', async () => {
    const profiles = await service.getAdminUsers(admin.id, 'admin', { placeholder: 'true' });
    expect(profiles.stats.total).toBe(4);
    expect(profiles.users.every(user => user.claimStatus !== null)).toBe(true);
    const all = await service.getAdminUsers(admin.id, 'admin', { placeholder: 'all' });
    expect(all.pagination.totalItems).toBe(8);
    expect(all.stats.total).toBe(8);
  });
  test('search and role counts match the filtered list, including out-of-range pages', async () => {
    const result = await service.getAdminUsers(admin.id, 'admin', { search: 'real', role: 'viewer', page: 99, limit: 1 });
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.totalItems).toBe(1);
    expect(result.stats).toEqual({ total: 1, byRole: { admin: 0, moderator: 0, editor: 0, viewer: 1 } });
    expect(result.users[0].username).toBe('realviewer');
  });
  test('moderator statistics cover their full scope, not just the current page', async () => {
    const result = await service.getAdminUsers(moderator.id, 'moderator', { limit: 1 });
    expect(result.users).toHaveLength(1);
    expect(result.stats.total).toBe(3);
    expect(result.pagination.totalItems).toBe(3);
    expect((await service.getUserStats(moderator.id, 'moderator')).total).toBe(3);
  });
});
