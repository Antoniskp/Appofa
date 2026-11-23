const TABLE = 'TikTokCreators';
const TEMP_TABLE = 'TikTokCreators_new';

async function changeNullability(queryInterface, Sequelize, allowNull) {
  const { sequelize } = queryInterface;
  await sequelize.transaction(async transaction => {
    if (sequelize.getDialect() === 'postgres') {
      const constraint = allowNull ? 'DROP NOT NULL' : 'SET NOT NULL';
      await sequelize.query(`ALTER TABLE "${TABLE}"
        ALTER COLUMN "category" ${constraint},
        ALTER COLUMN "locationId" ${constraint}`, { transaction });
      return;
    }

    // SQLite requires a table rebuild. Keep the existing foreign keys and index.
    const columns = {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      handle: { type: Sequelize.STRING(24), allowNull: false, unique: true },
      displayName: { type: Sequelize.STRING(100), allowNull: true },
      category: { type: Sequelize.STRING(24), allowNull },
      locationId: {
        type: Sequelize.INTEGER, allowNull,
        references: { model: 'Locations', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'pending' },
      reviewedByUserId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };
    await queryInterface.createTable(TEMP_TABLE, columns, { transaction });
    const fields = Object.keys(columns).map(field => `"${field}"`).join(', ');
    await sequelize.query(`INSERT INTO "${TEMP_TABLE}" (${fields}) SELECT ${fields} FROM "${TABLE}"`, { transaction });
    await queryInterface.dropTable(TABLE, { transaction });
    await queryInterface.renameTable(TEMP_TABLE, TABLE, { transaction });
    await queryInterface.addIndex(TABLE, ['status', 'locationId', 'category'], { name: 'tiktok_creators_directory_idx', transaction });
  });
}

module.exports = {
  up: (queryInterface, Sequelize) => changeNullability(queryInterface, Sequelize, true),
  down: (queryInterface, Sequelize) => changeNullability(queryInterface, Sequelize, false),
};
