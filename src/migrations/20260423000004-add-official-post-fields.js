'use strict';

async function ensureOfficialPostColumns(queryInterface, Sequelize, tableName) {
  const columns = await queryInterface.describeTable(tableName);

  if (!columns.isOfficialPost) {
    await queryInterface.addColumn(tableName, 'isOfficialPost', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  if (!columns.officialPostScope) {
    await queryInterface.addColumn(tableName, 'officialPostScope', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  }
}

async function removeOfficialPostColumns(queryInterface, tableName) {
  const columns = await queryInterface.describeTable(tableName);

  if (columns.officialPostScope) {
    await queryInterface.removeColumn(tableName, 'officialPostScope');
  }

  if (columns.isOfficialPost) {
    await queryInterface.removeColumn(tableName, 'isOfficialPost');
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await ensureOfficialPostColumns(queryInterface, Sequelize, 'Polls');
    await ensureOfficialPostColumns(queryInterface, Sequelize, 'Suggestions');
  },

  async down(queryInterface) {
    await removeOfficialPostColumns(queryInterface, 'Polls');
    await removeOfficialPostColumns(queryInterface, 'Suggestions');
  },
};
