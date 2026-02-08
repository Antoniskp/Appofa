'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'poll' to the entity_type enum in LocationLinks table
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_LocationLinks_entity_type" ADD VALUE IF NOT EXISTS 'poll';
    `);

    console.log('Added "poll" to LocationLinks entity_type enum');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL does not support removing values from enums directly
    // This would require recreating the enum and updating the column
    console.log('Warning: Cannot remove enum value "poll" from entity_type. Manual intervention required.');
  }
};
