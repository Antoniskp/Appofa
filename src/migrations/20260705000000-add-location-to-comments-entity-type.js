'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TYPE "enum_Comments_entityType" ADD VALUE IF NOT EXISTS 'location';
        EXCEPTION WHEN others THEN null;
        END $$;
      `);
    }
  },

  async down() {
    // PostgreSQL cannot remove enum values without recreating the type.
  },
};
