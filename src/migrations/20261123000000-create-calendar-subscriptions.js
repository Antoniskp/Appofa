module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable('CalendarSubscriptions', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
        category: { type: Sequelize.STRING(20), allowNull: true },
        locationId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Locations', key: 'id' }, onDelete: 'CASCADE' },
      }, { transaction });
      await queryInterface.addIndex('CalendarSubscriptions', ['userId', 'category'], { unique: true, transaction });
      await queryInterface.addIndex('CalendarSubscriptions', ['userId', 'locationId'], { unique: true, transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('CalendarSubscriptions');
  },
};
