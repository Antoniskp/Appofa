'use strict';

function hasTable(tables, expectedTableName) {
  return tables
    .map((table) => (typeof table === 'string' ? table : table.tableName || table.name || ''))
    .some((name) => String(name).toLowerCase() === expectedTableName.toLowerCase());
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add nationality to Users table
    const usersColumns = await queryInterface.describeTable('Users');
    if (!usersColumns.nationality) {
      await queryInterface.addColumn('Users', 'nationality', {
        type: Sequelize.STRING(5),
        allowNull: true,
      });
    }

    // Add nationality and countryCode to PublicPersonProfiles table when it exists
    const tables = await queryInterface.showAllTables();
    const hasPublicPersonProfiles = hasTable(tables, 'PublicPersonProfiles');

    if (hasPublicPersonProfiles) {
      const profileColumns = await queryInterface.describeTable('PublicPersonProfiles');
      if (!profileColumns.nationality) {
        await queryInterface.addColumn('PublicPersonProfiles', 'nationality', {
          type: Sequelize.STRING(5),
          allowNull: true,
        });
      }
      if (!profileColumns.countryCode) {
        await queryInterface.addColumn('PublicPersonProfiles', 'countryCode', {
          type: Sequelize.STRING(5),
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface) {
    const usersColumns = await queryInterface.describeTable('Users');
    if (usersColumns.nationality) {
      await queryInterface.removeColumn('Users', 'nationality');
    }

    const tables = await queryInterface.showAllTables();
    const hasPublicPersonProfiles = hasTable(tables, 'PublicPersonProfiles');

    if (hasPublicPersonProfiles) {
      const profileColumns = await queryInterface.describeTable('PublicPersonProfiles');
      if (profileColumns.nationality) {
        await queryInterface.removeColumn('PublicPersonProfiles', 'nationality');
      }
      if (profileColumns.countryCode) {
        await queryInterface.removeColumn('PublicPersonProfiles', 'countryCode');
      }
    }
  },
};
