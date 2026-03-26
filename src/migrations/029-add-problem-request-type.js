'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL: add the new value to the existing ENUM type
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Suggestions_type" ADD VALUE IF NOT EXISTS 'problem_request';`
      );
      console.log('Added problem_request to enum_Suggestions_type');
    } else {
      // SQLite (used in tests): recreate table with updated ENUM values
      // SQLite does not support ALTER TYPE — the ENUM is stored as TEXT with a CHECK constraint
      // sequelize.sync({ force: true }) in tests handles this automatically via the model,
      // so no manual migration is needed for SQLite.
      console.log('SQLite detected — ENUM update handled by model definition.');
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL does not support removing ENUM values directly.
      // A full type recreate would be needed; log a warning instead.
      console.warn('Rollback: cannot remove ENUM value in PostgreSQL without recreating the type. Manual intervention required.');
    } else {
      console.log('SQLite detected — no rollback needed.');
    }
  }
};
