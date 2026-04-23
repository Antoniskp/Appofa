'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (!tableNames.includes('OrganizationAnalytics')) {
      await queryInterface.createTable('OrganizationAnalytics', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        organizationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Organizations', key: 'id' },
          onDelete: 'CASCADE',
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        memberCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        activeMemberCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        pollCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        suggestionCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        officialPostCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }

    const indexes = await queryInterface.showIndex('OrganizationAnalytics');
    const hasUniqueIndex = indexes.some((index) => index.name === 'organization_analytics_organization_id_date_unique');
    if (!hasUniqueIndex) {
      await queryInterface.addIndex('OrganizationAnalytics', ['organizationId', 'date'], {
        unique: true,
        name: 'organization_analytics_organization_id_date_unique',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (tableNames.includes('OrganizationAnalytics')) {
      await queryInterface.dropTable('OrganizationAnalytics');
    }
  },
};
