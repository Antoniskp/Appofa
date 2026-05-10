'use strict';

const SEND_LOG_STATUSES = ['queued', 'sent', 'failed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (tableNames.includes('NewsletterSendLogs')) {
      return;
    }

    await queryInterface.createTable('NewsletterSendLogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      campaignId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'NewsletterCampaigns', key: 'id' },
        onDelete: 'CASCADE',
      },
      subscriberId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'NewsletterSubscribers', key: 'id' },
        onDelete: 'SET NULL',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...SEND_LOG_STATUSES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'queued',
      },
      providerMessageId: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('NewsletterSendLogs', ['campaignId']);
    await queryInterface.addIndex('NewsletterSendLogs', ['subscriberId']);
    await queryInterface.addIndex('NewsletterSendLogs', ['email']);
    await queryInterface.addIndex('NewsletterSendLogs', ['status']);
    await queryInterface.addIndex('NewsletterSendLogs', ['sentAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('NewsletterSendLogs').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_NewsletterSendLogs_status";').catch(() => {});
    }
  },
};
