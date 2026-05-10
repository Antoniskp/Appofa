'use strict';

const CAMPAIGN_STATUSES = ['draft', 'sending', 'sent', 'failed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (tableNames.includes('NewsletterCampaigns')) {
      return;
    }

    await queryInterface.createTable('NewsletterCampaigns', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      previewText: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      htmlContent: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      textContent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...CAMPAIGN_STATUSES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'draft',
      },
      audienceFilters: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdByAdminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      totalRecipients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      successCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failureCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('NewsletterCampaigns', ['status']);
    await queryInterface.addIndex('NewsletterCampaigns', ['createdByAdminId']);
    await queryInterface.addIndex('NewsletterCampaigns', ['sentAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('NewsletterCampaigns').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_NewsletterCampaigns_status";').catch(() => {});
    }
  },
};
