'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ActiveSessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique session identifier'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User ID if authenticated, null for anonymous'
      },
      lastActivity: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Last activity timestamp for session cleanup'
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

    // Add index on userId for fast lookups
    await queryInterface.addIndex('ActiveSessions', ['userId'], {
      name: 'active_sessions_user_index'
    });

    // Add index on lastActivity for cleanup queries
    await queryInterface.addIndex('ActiveSessions', ['lastActivity'], {
      name: 'active_sessions_activity_index'
    });

    console.log('ActiveSessions table created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ActiveSessions');
    console.log('ActiveSessions table dropped successfully');
  }
};
