module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable('TikTokCreators', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        handle: { type: Sequelize.STRING(24), allowNull: false, unique: true },
        displayName: { type: Sequelize.STRING(100), allowNull: true },
        category: { type: Sequelize.STRING(24), allowNull: false },
        locationId: {
          type: Sequelize.INTEGER, allowNull: false,
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
      }, { transaction });
      await queryInterface.addIndex('TikTokCreators', ['status', 'locationId', 'category'], {
        name: 'tiktok_creators_directory_idx', transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TikTokCreators');
  },
};
