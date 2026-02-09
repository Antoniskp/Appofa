'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Polls', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'description'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Polls', 'category');
  }
};
