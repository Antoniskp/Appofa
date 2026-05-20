'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Formations', 'isPrimary', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    // Add index for faster primary formation lookup per user
    await queryInterface.addIndex('Formations', ['userId', 'isPrimary']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Formations', ['userId', 'isPrimary']);
    await queryInterface.removeColumn('Formations', 'isPrimary');
  }
};
