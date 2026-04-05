'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add color column to PollOptions
    await queryInterface.addColumn('PollOptions', 'color', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    // Add useCustomColors column to Polls
    await queryInterface.addColumn('Polls', 'useCustomColors', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('PollOptions', 'color');
    await queryInterface.removeColumn('Polls', 'useCustomColors');
  }
};
