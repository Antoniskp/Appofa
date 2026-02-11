'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('Messages'));
    
    if (tableExists) {
      console.log('Messages table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('Messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('contact', 'moderator_application', 'general', 'bug_report', 'feature_request'),
        allowNull: false,
        defaultValue: 'contact'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'read', 'in_progress', 'responded', 'archived'),
        defaultValue: 'pending',
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      respondedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      respondedAt: {
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

    // Add indexes for better query performance
    await queryInterface.addIndex('Messages', ['type'], {
      name: 'message_type_index'
    });

    await queryInterface.addIndex('Messages', ['status'], {
      name: 'message_status_index'
    });

    await queryInterface.addIndex('Messages', ['userId'], {
      name: 'message_userId_index'
    });

    await queryInterface.addIndex('Messages', ['createdAt'], {
      name: 'message_createdAt_index'
    });

    console.log('Messages table created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    try {
      await queryInterface.removeIndex('Messages', 'message_createdAt_index');
    } catch (error) {
      console.warn('Index message_createdAt_index does not exist');
    }

    try {
      await queryInterface.removeIndex('Messages', 'message_userId_index');
    } catch (error) {
      console.warn('Index message_userId_index does not exist');
    }

    try {
      await queryInterface.removeIndex('Messages', 'message_status_index');
    } catch (error) {
      console.warn('Index message_status_index does not exist');
    }

    try {
      await queryInterface.removeIndex('Messages', 'message_type_index');
    } catch (error) {
      console.warn('Index message_type_index does not exist');
    }

    // Drop the table
    await queryInterface.dropTable('Messages');
    
    // Drop enum types
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_priority";');
    } catch (error) {
      console.warn('Warning: Could not drop enum types:', error.message);
    }

    console.log('Messages table dropped successfully');
  }
};
