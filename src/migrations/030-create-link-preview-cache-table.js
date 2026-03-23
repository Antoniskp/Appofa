'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('LinkPreviewCaches')) {
      await queryInterface.createTable('LinkPreviewCaches', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        normalizedUrl: {
          type: Sequelize.STRING(2048),
          allowNull: false,
          unique: true
        },
        provider: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        title: {
          type: Sequelize.STRING,
          allowNull: true
        },
        authorName: {
          type: Sequelize.STRING,
          allowNull: true
        },
        thumbnailUrl: {
          type: Sequelize.STRING(2048),
          allowNull: true
        },
        providerName: {
          type: Sequelize.STRING,
          allowNull: true
        },
        providerUrl: {
          type: Sequelize.STRING(2048),
          allowNull: true
        },
        embedUrl: {
          type: Sequelize.STRING(2048),
          allowNull: true
        },
        embedHtml: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('LinkPreviewCaches', ['normalizedUrl'], {
        unique: true,
        name: 'unique_link_preview_normalized_url'
      });
      await queryInterface.addIndex('LinkPreviewCaches', ['expiresAt']);

      console.log('LinkPreviewCaches table created successfully');
    } else {
      console.log('LinkPreviewCaches table already exists, skipping creation');
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('LinkPreviewCaches')) {
      await queryInterface.dropTable('LinkPreviewCaches');
      console.log('LinkPreviewCaches table dropped successfully');
    }
  }
};
