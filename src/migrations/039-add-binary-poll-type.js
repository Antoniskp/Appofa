'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Polls_type" ADD VALUE IF NOT EXISTS 'binary';`
      );
      console.log('Added "binary" to enum_Polls_type');
    } else {
      // SQLite (used in tests): ENUM is stored as TEXT; model definition handles it.
      console.log('SQLite detected — skipping enum alteration for enum_Polls_type.');
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      console.warn('Rollback: cannot remove ENUM value "binary" from enum_Polls_type in PostgreSQL without recreating the type. Manual intervention required.');
    } else {
      console.log('SQLite detected — no rollback needed.');
    }
  }
};
