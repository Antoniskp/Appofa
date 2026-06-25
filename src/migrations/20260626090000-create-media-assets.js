'use strict';

const MEDIA_USAGE_TYPES = ['shared', 'article_banner', 'article_body'];
const MEDIA_STATUSES = ['active', 'archived'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (tableNames.includes('MediaAssets')) {
      return;
    }

    await queryInterface.createTable('MediaAssets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      storageProvider: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'local',
      },
      storageKey: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usageType: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...MEDIA_USAGE_TYPES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'shared',
      },
      status: {
        type: dialect === 'postgres' ? Sequelize.ENUM(...MEDIA_STATUSES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'active',
      },
      altText: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      credit: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      uploadedByUserId: {
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

    await queryInterface.addIndex('MediaAssets', ['storageProvider']);
    await queryInterface.addIndex('MediaAssets', ['usageType']);
    await queryInterface.addIndex('MediaAssets', ['status']);
    await queryInterface.addIndex('MediaAssets', ['uploadedByUserId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MediaAssets').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MediaAssets_usageType";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MediaAssets_status";').catch(() => {});
    }
  },
};
