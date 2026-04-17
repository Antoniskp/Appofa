'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Polls', 'category', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.removeColumn('Polls', 'category');
  }
};
