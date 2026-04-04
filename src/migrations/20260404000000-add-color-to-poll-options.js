'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('PollOptions', 'color', {
      type: Sequelize.STRING(7),
      allowNull: true,
      defaultValue: null
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('PollOptions', 'color');
  }
};
