const badgeService = require('../src/services/badgeService');
const notificationService = require('../src/services/notificationService');
const { sequelize, User, UserBadge } = require('../src/models');

describe('badgeService founding-member badge', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    jest.spyOn(notificationService, 'notifyBadgeEarned').mockResolvedValue();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await UserBadge.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  test('awards founding-member to unverified users with id <= 100', async () => {
    const user = await User.create({
      id: 50,
      username: 'founder50',
      email: 'founder50@test.com',
      isVerified: false,
    });

    const newBadges = await badgeService.evaluate(user.id);

    expect(newBadges).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'founding-member', tier: 'gold' }),
    ]));
    const earned = await UserBadge.findAll({ where: { userId: user.id, badgeSlug: 'founding-member' } });
    expect(earned).toHaveLength(1);
  });

  test('does not award founding-member when id is greater than 100', async () => {
    const user = await User.create({
      id: 101,
      username: 'member101',
      email: 'member101@test.com',
      isVerified: false,
    });

    const newBadges = await badgeService.evaluate(user.id);

    expect(newBadges.find(b => b.slug === 'founding-member')).toBeUndefined();
    const earned = await UserBadge.findAll({ where: { userId: user.id, badgeSlug: 'founding-member' } });
    expect(earned).toHaveLength(0);
  });

  test('awards founding-member at the boundary id of 100', async () => {
    const user = await User.create({
      id: 100,
      username: 'founder100',
      email: 'founder100@test.com',
      isVerified: false,
    });

    const newBadges = await badgeService.evaluate(user.id);

    expect(newBadges).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'founding-member', tier: 'gold' }),
    ]));
  });

  test('awards founding-member only once', async () => {
    const user = await User.create({
      id: 75,
      username: 'founder75',
      email: 'founder75@test.com',
      isVerified: false,
    });

    const first = await badgeService.evaluate(user.id);
    const second = await badgeService.evaluate(user.id);

    expect(first.find(b => b.slug === 'founding-member')).toBeTruthy();
    expect(second.find(b => b.slug === 'founding-member')).toBeUndefined();
    const earned = await UserBadge.findAll({ where: { userId: user.id, badgeSlug: 'founding-member' } });
    expect(earned).toHaveLength(1);
  });
});
