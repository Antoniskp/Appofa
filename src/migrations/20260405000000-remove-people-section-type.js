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

    await queryInterface.sequelize.query(`
      -- 1. Remove any orphaned rows (there should be none, but be safe)
      DELETE FROM "LocationSections" WHERE type = 'people';

      -- 2. Rename old enum
      ALTER TYPE "enum_LocationSections_type" RENAME TO "enum_LocationSections_type_old";

      -- 3. Create new enum without 'people'
      CREATE TYPE "enum_LocationSections_type" AS ENUM (
        'official_links',
        'contacts',
        'webcams',
        'announcements',
        'news_sources'
      );

      -- 4. Alter column to use new enum (cast through text)
      ALTER TABLE "LocationSections"
        ALTER COLUMN type TYPE "enum_LocationSections_type"
        USING type::text::"enum_LocationSections_type";

      -- 5. Drop old enum
      DROP TYPE "enum_LocationSections_type_old";
    `);
  },

  async down() {
    // Re-adding a removed enum value is possible but not necessary since there
    // is no data to restore. Treat down() as a no-op.
  }
};
