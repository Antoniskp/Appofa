'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'moderatorLocationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'The location this user moderates (separate from homeLocationId)'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'moderatorLocationId');
  }
};
