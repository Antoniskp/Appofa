'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // 1. Create Tags table
    await queryInterface.createTable('Tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
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

    // 2. Create TaggableItems table
    await queryInterface.createTable('TaggableItems', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tagId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      entityType: {
        type: dialect === 'sqlite' ? Sequelize.STRING(50) : Sequelize.ENUM('article', 'poll', 'suggestion'),
        allowNull: false
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false
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

    // Add unique constraint on (tagId, entityType, entityId)
    await queryInterface.addConstraint('TaggableItems', {
      fields: ['tagId', 'entityType', 'entityId'],
      type: 'unique',
      name: 'taggable_items_unique'
    });

    // Add index on (entityType, entityId) for fast reverse lookup
    await queryInterface.addIndex('TaggableItems', ['entityType', 'entityId'], {
      name: 'taggable_items_entity_idx'
    });

    // 3. Remove tags column from Articles
    try {
      const articleTable = await queryInterface.describeTable('Articles');
      if (articleTable.tags) {
        await queryInterface.removeColumn('Articles', 'tags');
      }
    } catch {
      // Articles table may not exist in partial migration runs.
    }

    // 4. Remove tags column from Polls
    try {
      const pollTable = await queryInterface.describeTable('Polls');
      if (pollTable.tags) {
        await queryInterface.removeColumn('Polls', 'tags');
      }
    } catch {
      // Polls table may not exist in partial migration runs.
    }
  },

  async down(queryInterface, Sequelize) {
    // Restore tags column to Articles
    try {
      const articleTable = await queryInterface.describeTable('Articles');
      if (!articleTable.tags) {
        await queryInterface.addColumn('Articles', 'tags', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: '[]'
        });
      }
    } catch {
      // Articles table may not exist in partial rollback runs.
    }

    // Restore tags column to Polls
    try {
      const pollTable = await queryInterface.describeTable('Polls');
      if (!pollTable.tags) {
        await queryInterface.addColumn('Polls', 'tags', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: '[]'
        });
      }
    } catch {
      // Polls table may not exist in partial rollback runs.
    }

    // Remove TaggableItems table
    await queryInterface.dropTable('TaggableItems');

    // Remove Tags table
    await queryInterface.dropTable('Tags');
  }
};
