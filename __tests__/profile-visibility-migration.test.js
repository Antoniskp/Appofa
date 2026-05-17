const { Sequelize } = require('sequelize');
const migration = require('../src/migrations/20260517211000-add-profile-visibility-to-users');

describe('20260517211000-add-profile-visibility-to-users migration', () => {
  let sequelize;
  let queryInterface;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      searchable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.bulkInsert('Users', [
      { searchable: true, createdAt: new Date(), updatedAt: new Date() },
      { searchable: false, createdAt: new Date(), updatedAt: new Date() },
    ]);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  test('up maps searchable -> profileVisibility and drops searchable column', async () => {
    await migration.up(queryInterface, Sequelize);

    const columns = await queryInterface.describeTable('Users');
    expect(columns.profileVisibility).toBeDefined();
    expect(columns.searchable).toBeUndefined();

    const rows = await sequelize.query('SELECT id, "profileVisibility" FROM "Users" ORDER BY id ASC', {
      type: Sequelize.QueryTypes.SELECT,
    });
    expect(rows[0].profileVisibility).toBe('registered');
    expect(rows[1].profileVisibility).toBe('hidden');
  });

  test('down restores searchable and maps hidden back to false', async () => {
    await migration.up(queryInterface, Sequelize);
    await migration.down(queryInterface, Sequelize);

    const columns = await queryInterface.describeTable('Users');
    expect(columns.searchable).toBeDefined();
    expect(columns.profileVisibility).toBeUndefined();

    const rows = await sequelize.query('SELECT id, searchable FROM "Users" ORDER BY id ASC', {
      type: Sequelize.QueryTypes.SELECT,
    });
    expect(rows[0].searchable).toBe(1);
    expect(rows[1].searchable).toBe(0);
  });

  test('up uses PostgreSQL-safe boolean SQL for searchable backfill', async () => {
    const query = jest.fn();
    const addColumn = jest.fn();
    const removeColumn = jest.fn();
    const describeTable = jest.fn()
      .mockResolvedValueOnce({ searchable: { type: 'BOOLEAN' } })
      .mockResolvedValueOnce({
        searchable: { type: 'BOOLEAN' },
        profileVisibility: { type: 'ENUM' },
      });

    await migration.up({
      describeTable,
      addColumn,
      removeColumn,
      sequelize: {
        getDialect: () => 'postgres',
        query,
      },
    }, Sequelize);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('"searchable" IS FALSE'));
    expect(query).toHaveBeenCalledWith(expect.stringContaining(`'hidden'::"enum_Users_profileVisibility"`));
    expect(query).toHaveBeenCalledWith(expect.stringContaining(`'registered'::"enum_Users_profileVisibility"`));
    expect(query).not.toHaveBeenCalledWith(expect.stringContaining('"searchable" = 0'));
  });

  test('down uses PostgreSQL-safe enum comparison SQL when restoring searchable', async () => {
    const query = jest.fn();
    const addColumn = jest.fn();
    const removeColumn = jest.fn();
    const describeTable = jest.fn()
      .mockResolvedValueOnce({ profileVisibility: { type: 'ENUM' } });

    await migration.down({
      describeTable,
      addColumn,
      removeColumn,
      sequelize: {
        getDialect: () => 'postgres',
        query,
      },
    }, Sequelize);

    expect(query).toHaveBeenCalledWith(expect.stringContaining(`'hidden'::"enum_Users_profileVisibility"`));
    expect(query).toHaveBeenCalledWith('DROP TYPE IF EXISTS "enum_Users_profileVisibility";');
  });
});
