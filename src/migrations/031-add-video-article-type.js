'use strict';

module.exports = {
  async up(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Articles').catch(() => null);
    if (!tableDescription) {
      console.log('Articles table does not exist, skipping video type migration');
      return;
    }

    // Add 'video' to the existing ENUM type for the Articles.type column
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Articles_type" ADD VALUE IF NOT EXISTS 'video';`
    );
    console.log('Added video to enum_Articles_type');
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Articles').catch(() => null);
    if (!tableDescription) return;

    // PostgreSQL does not support removing values from an ENUM directly.
    // Recreate the ENUM without 'video' and migrate the column.
    await queryInterface.sequelize.query(`
      UPDATE "Articles" SET "type" = 'personal' WHERE "type" = 'video';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Articles_type" RENAME TO "enum_Articles_type_old";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Articles_type" AS ENUM('personal', 'articles', 'news');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Articles"
        ALTER COLUMN "type" TYPE "enum_Articles_type"
        USING ("type"::text::"enum_Articles_type");
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Articles_type_old";
    `);
    console.log('Removed video from enum_Articles_type');
  }
};
