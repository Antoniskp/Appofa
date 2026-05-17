'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    const dialect = queryInterface.sequelize.getDialect();

    if (!tableDescription.profileVisibility) {
      await queryInterface.addColumn('Users', 'profileVisibility', {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('hidden', 'registered', 'public')
          : Sequelize.STRING,
        allowNull: false,
        defaultValue: 'registered',
      });
    }

    if (tableDescription.searchable) {
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET "profileVisibility" = CASE
          WHEN "searchable" = FALSE OR "searchable" = 0 THEN 'hidden'
          ELSE 'registered'
        END
      `);
    }

    const refreshedTable = await queryInterface.describeTable('Users');
    if (refreshedTable.searchable) {
      await queryInterface.removeColumn('Users', 'searchable');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    const dialect = queryInterface.sequelize.getDialect();

    if (!tableDescription.searchable) {
      await queryInterface.addColumn('Users', 'searchable', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (tableDescription.profileVisibility) {
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET "searchable" = CASE
          WHEN "profileVisibility" = 'hidden' THEN FALSE
          ELSE TRUE
        END
      `);

      await queryInterface.removeColumn('Users', 'profileVisibility');

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_profileVisibility";');
      }
    }
  },
};
