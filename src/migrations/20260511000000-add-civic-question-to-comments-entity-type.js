'use strict';

/**
 * Migration: Add 'civic_question' to the Comments.entityType ENUM.
 *
 * PostgreSQL does not support adding a value to an existing ENUM easily — we
 * use ALTER TYPE … ADD VALUE which is idempotent-safe via the IF NOT EXISTS
 * clause (available since PostgreSQL 9.1).
 * SQLite uses a plain STRING column so no DDL change is needed there.
 */
module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Comments_entityType" ADD VALUE IF NOT EXISTS 'civic_question';
      `);
    }
    // SQLite: ENUM is stored as STRING, no migration needed.
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL does not support removing ENUM values without recreating the type.
      // Log a warning; manual intervention is needed if a rollback is required.
      console.warn(
        'down migration: removing enum values from PostgreSQL requires manual DDL. ' +
        'The civic_question value in enum_Comments_entityType was NOT removed.'
      );
    }
  }
};
