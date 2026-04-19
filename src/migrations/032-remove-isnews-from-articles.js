'use strict';

module.exports = {
  async up(queryInterface, _Sequelize) {
    let articleTable;
    try {
      articleTable = await queryInterface.describeTable('Articles');
    } catch {
      return;
    }
    if (!articleTable.isNews) {
      return;
    }

    await queryInterface.sequelize.query(
      'UPDATE "Articles" SET "type" = \'news\' WHERE "isNews" = true AND "type" != \'news\';'
    );

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('ALTER TABLE "Articles" DROP COLUMN IF EXISTS "isNews";');
    } else {
      await queryInterface.removeColumn('Articles', 'isNews');
    }
  },

  async down(queryInterface, Sequelize) {
    let articleTable;
    try {
      articleTable = await queryInterface.describeTable('Articles');
    } catch {
      return;
    }
    if (!articleTable.isNews) {
      await queryInterface.addColumn('Articles', 'isNews', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    await queryInterface.sequelize.query(
      'UPDATE "Articles" SET "isNews" = CASE WHEN "type" = \'news\' THEN true ELSE false END;'
    );
  }
};
