'use strict';

/**
 * Add 'electoral_district' to the Location type ENUM.
 * Electoral districts are political representation units distinct from
 * administrative geography (prefecture, municipality).
 */
module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL requires an explicit ALTER TYPE to add an enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Locations_type" ADD VALUE IF NOT EXISTS 'electoral_district';
      `);
    }
    // SQLite uses STRING under the hood — Sequelize will accept the new value
    // without a DDL change.
  },

  async down() {
    // PostgreSQL does not support removing enum values without a full recreate.
    // This migration is intentionally irreversible.
  }
};
