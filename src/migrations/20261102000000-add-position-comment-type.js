'use strict';

module.exports = {
  async up(queryInterface) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_Comments_entityType" ADD VALUE IF NOT EXISTS 'position'`);
    }
  },
  async down() { /* PostgreSQL cannot remove individual enum values. */ },
};
