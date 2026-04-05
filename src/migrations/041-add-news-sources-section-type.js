'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_LocationSections_type" ADD VALUE IF NOT EXISTS 'news_sources';
    `);
  },
  async down() { /* enum values cannot be removed in Postgres without recreating */ }
};
