const { sequelize, User, Location } = require('../src/models');
const authService = require('../src/services/authService');

describe('authService.registerUser diaspora fields', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'auth-service-register-test-secret';
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('persists isDiaspora, residenceCountryCode, and homeLocationId', async () => {
    const homeCountry = await Location.create({
      name: 'Cyprus',
      type: 'country',
      slug: 'cyprus-test',
      code: 'CY',
    });

    const { user, token } = await authService.registerUser({
      username: 'diasporatest',
      email: 'diaspora-register@test.com',
      password: 'Diaspora123!',
      firstNameNative: 'Test',
      lastNameNative: 'Diaspora',
      isDiaspora: true,
      residenceCountryCode: 'de',
      homeLocationId: homeCountry.id,
    });

    expect(token).toBeTruthy();
    expect(user.id).toBeTruthy();

    const persisted = await User.findByPk(user.id);
    expect(persisted.isDiaspora).toBe(true);
    expect(persisted.residenceCountryCode).toBe('DE');
    expect(persisted.homeLocationId).toBe(homeCountry.id);
  });
});
