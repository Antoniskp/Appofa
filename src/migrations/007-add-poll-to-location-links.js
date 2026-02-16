'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // PostgreSQL enum update: add 'poll' to LocationLinks.entity_type.
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_LocationLinks_entity_type" ADD VALUE IF NOT EXISTS 'poll';
      `);
      console.log('Added "poll" to LocationLinks entity_type enum');
      return;
    }

    // Non-Postgres test dialects (e.g. sqlite) do not use enum types.
    console.log(`Skipped enum alteration for dialect: ${dialect}`);
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL does not support removing enum values directly.
      console.log('Warning: Cannot remove enum value "poll" from entity_type. Manual intervention required.');
      return;
    }

    console.log(`No enum rollback required for dialect: ${dialect}`);
  }
};
