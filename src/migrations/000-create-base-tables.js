'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if Users table already exists
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('Users')) {
      console.log('Users table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'moderator', 'editor', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
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

    console.log('Users table created successfully');

    // Also create Articles table if needed
    if (!tables.includes('Articles')) {
      await queryInterface.createTable('Articles', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        summary: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        bannerImageUrl: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: '/images/branding/news default.png'
        },
        authorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        status: {
          type: Sequelize.ENUM('draft', 'published', 'archived'),
          defaultValue: 'draft',
          allowNull: false
        },
        publishedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        category: {
          type: Sequelize.STRING,
          allowNull: true
        },
        type: {
          type: Sequelize.ENUM('personal', 'articles', 'news'),
          defaultValue: 'personal',
          allowNull: false
        },
        isNews: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        newsApprovedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        newsApprovedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        tags: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: '[]'
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

      console.log('Articles table created successfully');
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop Articles table first (has foreign key to Users)
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('Articles')) {
      await queryInterface.dropTable('Articles');
      
      // Drop enum types
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Articles_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Articles_type";');
      } catch (error) {
        console.warn('Warning: Could not drop enum types:', error.message);
      }
      
      console.log('Articles table dropped successfully');
    }

    if (tables.includes('Users')) {
      await queryInterface.dropTable('Users');
      
      // Drop enum type
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
      } catch (error) {
        console.warn('Warning: Could not drop enum type:', error.message);
      }
      
      console.log('Users table dropped successfully');
    }
  }
};
