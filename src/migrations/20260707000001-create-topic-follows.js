'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TopicFollows', {
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
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('TopicFollows', ['topicId', 'userId'], {
      unique: true,
      name: 'topic_follows_topic_user_unique'
    });
    await queryInterface.addIndex('TopicFollows', ['userId'], { name: 'topic_follows_user_idx' });
    await queryInterface.addIndex('TopicFollows', ['topicId'], { name: 'topic_follows_topic_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TopicFollows');
  }
};
