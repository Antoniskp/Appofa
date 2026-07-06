'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Topics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tagId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(140),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      aliases: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      heroImageUrl: {
        type: Sequelize.STRING(2048),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'active'
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      updatedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('Topics', ['slug'], { name: 'topics_slug_idx' });
    await queryInterface.addIndex('Topics', ['status', 'isFeatured'], { name: 'topics_status_featured_idx' });

    await queryInterface.createTable('TopicExternalLinks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      topicId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Topics',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      url: {
        type: Sequelize.STRING(2048),
        allowNull: false
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'website'
      },
      sourceType: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'link'
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: true
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
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'approved'
      },
      submittedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('TopicExternalLinks', ['topicId', 'status'], {
      name: 'topic_external_links_topic_status_idx'
    });
    await queryInterface.addIndex('TopicExternalLinks', ['provider'], {
      name: 'topic_external_links_provider_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TopicExternalLinks');
    await queryInterface.dropTable('Topics');
  }
};
