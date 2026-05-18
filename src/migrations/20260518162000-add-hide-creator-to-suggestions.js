'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch {
        return null;
      }
    };

    const suggestionTable = await describeOrNull('Suggestions');

    if (suggestionTable) {
      if (!suggestionTable.hideCreator) {
        await queryInterface.addColumn('Suggestions', 'hideCreator', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }
    }
  },

  async down(queryInterface) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch {
        return null;
      }
    };

    const suggestionTable = await describeOrNull('Suggestions');

    if (suggestionTable?.hideCreator) {
      await queryInterface.removeColumn('Suggestions', 'hideCreator');
    }
  },
};
