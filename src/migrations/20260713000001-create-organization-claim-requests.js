'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'object' ? table.tableName || table.name : table));
    if (tableNames.includes('OrganizationClaimRequests')) return;

    await queryInterface.createTable('OrganizationClaimRequests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      roleTitle: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      contactEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      supportingStatement: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      reviewedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('OrganizationClaimRequests', ['organizationId'], {
      name: 'organization_claim_org_id_index',
    });
    await queryInterface.addIndex('OrganizationClaimRequests', ['userId'], {
      name: 'organization_claim_user_id_index',
    });
    await queryInterface.addIndex('OrganizationClaimRequests', ['status'], {
      name: 'organization_claim_status_index',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'object' ? table.tableName || table.name : table));
    if (!tableNames.includes('OrganizationClaimRequests')) return;

    await queryInterface.dropTable('OrganizationClaimRequests');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OrganizationClaimRequests_status";');
    }
  },
};
