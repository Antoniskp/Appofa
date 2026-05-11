'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // Safely add the new enum value; no-op if already present
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TYPE "enum_Comments_entityType" ADD VALUE IF NOT EXISTS 'civic_question';
        EXCEPTION WHEN others THEN null;
        END $$;
      `);
    }
    // For SQLite (and other dialects), the entityType column is STRING so no DDL change is needed.
  },

  async down() {
    // Postgres does not support removing enum values without recreating the type.
    // The down migration is intentionally a no-op to preserve data integrity.
  },
};
