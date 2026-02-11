'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const articleTable = await queryInterface.describeTable('Articles');
    const pollTable = await queryInterface.describeTable('Polls');

    if (!articleTable.hideAuthor) {
      await queryInterface.addColumn('Articles', 'hideAuthor', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('Added hideAuthor column to Articles table');
    } else {
      console.log('hideAuthor column already exists in Articles table');
    }

    if (!pollTable.hideCreator) {
      await queryInterface.addColumn('Polls', 'hideCreator', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('Added hideCreator column to Polls table');
    } else {
      console.log('hideCreator column already exists in Polls table');
    }
  },

  async down(queryInterface) {
    const articleTable = await queryInterface.describeTable('Articles');
    const pollTable = await queryInterface.describeTable('Polls');

    if (articleTable.hideAuthor) {
      await queryInterface.removeColumn('Articles', 'hideAuthor');
      console.log('Removed hideAuthor column from Articles table');
    }

    if (pollTable.hideCreator) {
      await queryInterface.removeColumn('Polls', 'hideCreator');
      console.log('Removed hideCreator column from Polls table');
    }
  }
};
