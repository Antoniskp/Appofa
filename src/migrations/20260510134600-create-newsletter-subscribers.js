'use strict';

const SUBSCRIBER_STATUSES = ['pending', 'subscribed', 'unsubscribed'];
const SUBSCRIBER_SOURCES = ['website', 'admin_manual', 'import'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (tableNames.includes('NewsletterSubscribers')) {
      return;
    }

    await queryInterface.createTable('NewsletterSubscribers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      status: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...SUBSCRIBER_STATUSES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'subscribed',
      },
      source: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...SUBSCRIBER_SOURCES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'website',
      },
      locale: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      subscribedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unsubscribedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unsubscribeTokenHash: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
      },
      createdByAdminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('NewsletterSubscribers', ['status']);
    await queryInterface.addIndex('NewsletterSubscribers', ['source']);
    await queryInterface.addIndex('NewsletterSubscribers', ['locale']);
    await queryInterface.addIndex('NewsletterSubscribers', ['subscribedAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('NewsletterSubscribers').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_NewsletterSubscribers_status";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_NewsletterSubscribers_source";').catch(() => {});
    }
  },
};
