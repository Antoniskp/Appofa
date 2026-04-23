'use strict';

const ORGANIZATION_TYPES = ['company', 'organization', 'institution', 'school', 'university', 'party'];
const MEMBER_ROLES = ['owner', 'admin', 'moderator', 'member'];
const MEMBER_STATUSES = ['active', 'invited', 'pending'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (!tableNames.includes('Organizations')) {
      await queryInterface.createTable('Organizations', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        type: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...ORGANIZATION_TYPES) : Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        logo: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        website: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        contactEmail: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        locationId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Locations', key: 'id' },
          onDelete: 'SET NULL',
        },
        isPublic: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        isVerified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdByUserId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
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

      await queryInterface.addIndex('Organizations', ['slug'], {
        unique: true,
        name: 'organization_slug_unique',
      });
    }

    if (!tableNames.includes('OrganizationMembers')) {
      await queryInterface.createTable('OrganizationMembers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
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
        role: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...MEMBER_ROLES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'member',
        },
        status: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...MEMBER_STATUSES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'active',
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

      await queryInterface.addIndex('OrganizationMembers', ['organizationId', 'userId'], {
        unique: true,
        name: 'organization_member_unique',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OrganizationMembers').catch(() => {});
    await queryInterface.dropTable('Organizations').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OrganizationMembers_role";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_OrganizationMembers_status";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Organizations_type";').catch(() => {});
    }
  },
};
