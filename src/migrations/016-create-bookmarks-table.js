'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookmarks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      entityType: {
        type: Sequelize.ENUM('article', 'poll'),
        allowNull: false
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('Bookmarks', ['userId', 'entityType', 'entityId'], {
      unique: true,
      name: 'bookmarks_user_entity_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Bookmarks', 'bookmarks_user_entity_unique');
    await queryInterface.dropTable('Bookmarks');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Bookmarks_entityType";');
  }
};
