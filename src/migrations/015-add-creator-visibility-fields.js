'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch (error) {
        return null;
      }
    };

    const articleTable = await describeOrNull('Articles');
    const pollTable = await describeOrNull('Polls');

    if (articleTable) {
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
    } else {
      console.log('Skipping Articles.hideAuthor (table does not exist)');
    }

    if (pollTable) {
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
    } else {
      console.log('Skipping Polls.hideCreator (table does not exist)');
    }
  },

  async down(queryInterface) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch (error) {
        return null;
      }
    };

    const articleTable = await describeOrNull('Articles');
    const pollTable = await describeOrNull('Polls');

    if (articleTable?.hideAuthor) {
      await queryInterface.removeColumn('Articles', 'hideAuthor');
      console.log('Removed hideAuthor column from Articles table');
    }

    if (pollTable?.hideCreator) {
      await queryInterface.removeColumn('Polls', 'hideCreator');
      console.log('Removed hideCreator column from Polls table');
    }
  }
};
