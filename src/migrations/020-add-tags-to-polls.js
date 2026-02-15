'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const pollTable = await queryInterface.describeTable('Polls');

    if (!pollTable.tags) {
      await queryInterface.addColumn('Polls', 'tags', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      });
      console.log('Added tags column to Polls table');
    } else {
      console.log('tags column already exists in Polls table');
    }
  },

  async down(queryInterface) {
    const pollTable = await queryInterface.describeTable('Polls');

    if (pollTable.tags) {
      await queryInterface.removeColumn('Polls', 'tags');
      console.log('Removed tags column from Polls table');
    }
  }
};
