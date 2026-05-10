'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('NewsletterCampaigns');

    if (!table.scheduledAt) {
      await queryInterface.addColumn('NewsletterCampaigns', 'scheduledAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.addIndex('NewsletterCampaigns', ['scheduledAt']);
    }

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           ALTER TYPE "enum_NewsletterCampaigns_status" ADD VALUE IF NOT EXISTS 'scheduled';
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$;`
      );
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('NewsletterCampaigns');
    if (table.scheduledAt) {
      await queryInterface.removeColumn('NewsletterCampaigns', 'scheduledAt');
    }
    // Status enum value rollback is intentionally skipped (unsafe in PostgreSQL).
  },
};
