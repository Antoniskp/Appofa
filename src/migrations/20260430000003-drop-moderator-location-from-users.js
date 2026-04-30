'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    if (tableDescription.moderatorLocationId) {
      await queryInterface.removeColumn('Users', 'moderatorLocationId');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    if (!tableDescription.moderatorLocationId) {
      await queryInterface.addColumn('Users', 'moderatorLocationId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  }
};
