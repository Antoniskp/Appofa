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

    const dialect = queryInterface.sequelize.getDialect();
    const trueValue = dialect === 'sqlite' ? '1' : 'true';
    await queryInterface.sequelize.query(
      `UPDATE "Articles" SET "type" = 'news' WHERE "isNews" = ${trueValue} AND ("type" != 'news' OR "type" IS NULL);`
    );

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

    const dialect = queryInterface.sequelize.getDialect();
    const trueValue = dialect === 'sqlite' ? '1' : 'true';
    const falseValue = dialect === 'sqlite' ? '0' : 'false';
    await queryInterface.sequelize.query(
      `UPDATE "Articles" SET "isNews" = CASE WHEN "type" = 'news' THEN ${trueValue} ELSE ${falseValue} END;`
    );
  }
};
