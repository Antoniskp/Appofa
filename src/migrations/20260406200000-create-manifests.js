'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('Manifests')) {
      await queryInterface.createTable('Manifests', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        articleUrl: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        displayOrder: {
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

      await queryInterface.addIndex('Manifests', ['isActive', 'displayOrder'], {
        name: 'manifests_active_order',
      });
    }

    if (!tables.includes('ManifestAcceptances')) {
      await queryInterface.createTable('ManifestAcceptances', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        manifestId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Manifests', key: 'id' },
          onDelete: 'CASCADE',
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        },
        acceptedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

      await queryInterface.addIndex('ManifestAcceptances', ['manifestId', 'userId'], {
        unique: true,
        name: 'unique_manifest_user',
      });

      await queryInterface.addIndex('ManifestAcceptances', ['manifestId'], {
        name: 'manifest_acceptances_manifest_id',
      });

      await queryInterface.addIndex('ManifestAcceptances', ['userId'], {
        name: 'manifest_acceptances_user_id',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ManifestAcceptances').catch(() => {});
    await queryInterface.dropTable('Manifests').catch(() => {});
  },
};
