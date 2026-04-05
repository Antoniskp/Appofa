/**
 * Migration: Remove 'people' from the LocationSections type enum.
 *
 * Postgres does not support removing enum values directly, so we must:
 *  1. Delete any rows that still use type = 'people' (safety measure).
 *  2. Rename the old enum.
 *  3. Create a new enum without 'people'.
 *  4. Alter the column to use the new enum.
 *  5. Drop the old enum.
 */
module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') return;

    // Remove any existing 'people' sections (there should be none)
    await queryInterface.sequelize.query(
      `DELETE FROM "LocationSections" WHERE type = 'people';`
    );

    // Recreate enum without 'people'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_LocationSections_type" RENAME TO "enum_LocationSections_type_old";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_LocationSections_type" AS ENUM (
        'official_links', 'contacts', 'webcams', 'announcements', 'news_sources'
      );
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "LocationSections"
        ALTER COLUMN type TYPE "enum_LocationSections_type"
        USING type::text::"enum_LocationSections_type";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_LocationSections_type_old";
    `);
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') return;

    // Re-add 'people' value
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_LocationSections_type" ADD VALUE IF NOT EXISTS 'people';
    `);
  }
};
