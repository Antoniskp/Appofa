'use strict';

const CONTENT_TYPES = ['live', 'viral'];
const CATEGORIES = ['local-news', 'traffic', 'weather', 'events', 'safety', 'community', 'other'];
const STATUSES = ['pending', 'approved', 'hidden', 'broken', 'ended', 'expired', 'removed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('VideoPins')) {
      console.log('VideoPins table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('VideoPins', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      contentType: {
        type: Sequelize.ENUM(...CONTENT_TYPES),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(...CATEGORIES),
        allowNull: false,
        defaultValue: 'local-news'
      },
      status: {
        type: Sequelize.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'pending'
      },
      sourceProvider: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      sourceUrl: {
        type: Sequelize.STRING(2048),
        allowNull: false
      },
      canonicalUrl: {
        type: Sequelize.STRING(2048),
        allowNull: true
      },
      providerVideoId: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      creatorHandle: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      creatorName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      creatorUrl: {
        type: Sequelize.STRING(2048),
        allowNull: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      thumbnailUrl: {
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
      sourceMeta: {
        type: Sequelize.JSON,
        allowNull: true
      },
      lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      submittedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      moderatedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      moderatedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('VideoPins', ['status', 'contentType'], { name: 'video_pins_status_content_type_idx' });
    await queryInterface.addIndex('VideoPins', ['category', 'status'], { name: 'video_pins_category_status_idx' });
    await queryInterface.addIndex('VideoPins', ['sourceProvider', 'providerVideoId'], { name: 'video_pins_provider_video_id_idx' });
    await queryInterface.addIndex('VideoPins', ['creatorHandle', 'status'], { name: 'video_pins_creator_status_idx' });
    await queryInterface.addIndex('VideoPins', ['contentType', 'expiresAt'], { name: 'video_pins_content_expires_idx' });
    await queryInterface.addIndex('VideoPins', ['status', 'createdAt'], { name: 'video_pins_status_created_at_idx' });
    await queryInterface.addIndex('VideoPins', ['locationId', 'status'], { name: 'video_pins_location_status_idx' });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('VideoPins')) return;

    await queryInterface.dropTable('VideoPins');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_VideoPins_contentType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_VideoPins_category";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_VideoPins_status";');
    }
  }
};
