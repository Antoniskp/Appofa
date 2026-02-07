'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if tables already exist
    const tables = await queryInterface.showAllTables();
    
    // Create Polls table
    if (!tables.includes('Polls')) {
      await queryInterface.createTable('Polls', {
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
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('open', 'closed'),
          defaultValue: 'open',
          allowNull: false
        },
        creatorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        pollType: {
          type: Sequelize.ENUM('simple', 'complex'),
          defaultValue: 'simple',
          allowNull: false
        },
        questionType: {
          type: Sequelize.ENUM('single-choice', 'ranked-choice', 'free-text'),
          defaultValue: 'single-choice',
          allowNull: false
        },
        allowUnauthenticatedVoting: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        allowUserAddOptions: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        settings: {
          type: Sequelize.JSON,
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

      // Add index on creatorId for faster lookups
      await queryInterface.addIndex('Polls', ['creatorId'], {
        name: 'polls_creator_id_idx'
      });

      // Add index on status for filtering
      await queryInterface.addIndex('Polls', ['status'], {
        name: 'polls_status_idx'
      });

      console.log('Polls table created successfully');
    } else {
      console.log('Polls table already exists, skipping creation');
    }

    // Create PollOptions table
    if (!tables.includes('PollOptions')) {
      await queryInterface.createTable('PollOptions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        pollId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Polls',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        optionText: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        optionType: {
          type: Sequelize.ENUM('text', 'article', 'person'),
          defaultValue: 'text',
          allowNull: false
        },
        imageUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        linkUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        displayName: {
          type: Sequelize.STRING,
          allowNull: true
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true
        },
        createdById: {
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
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Add index on pollId for faster lookups
      await queryInterface.addIndex('PollOptions', ['pollId'], {
        name: 'poll_options_poll_id_idx'
      });

      // Add index on createdById for user-added options
      await queryInterface.addIndex('PollOptions', ['createdById'], {
        name: 'poll_options_created_by_id_idx'
      });

      // Add index on order for sorting
      await queryInterface.addIndex('PollOptions', ['pollId', 'order'], {
        name: 'poll_options_poll_id_order_idx'
      });

      console.log('PollOptions table created successfully');
    } else {
      console.log('PollOptions table already exists, skipping creation');
    }

    // Create Votes table
    if (!tables.includes('Votes')) {
      await queryInterface.createTable('Votes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        pollId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Polls',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        optionId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'PollOptions',
            key: 'id'
          },
          onDelete: 'CASCADE'
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
        isAuthenticated: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        rankPosition: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        freeTextResponse: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        sessionId: {
          type: Sequelize.STRING,
          allowNull: true
        },
        ipAddress: {
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

      // Add index on pollId for faster lookups
      await queryInterface.addIndex('Votes', ['pollId'], {
        name: 'votes_poll_id_idx'
      });

      // Add index on optionId for vote counting
      await queryInterface.addIndex('Votes', ['optionId'], {
        name: 'votes_option_id_idx'
      });

      // Add index on userId for user vote history
      await queryInterface.addIndex('Votes', ['userId'], {
        name: 'votes_user_id_idx'
      });

      // Add index on sessionId for unauthenticated vote tracking
      await queryInterface.addIndex('Votes', ['sessionId'], {
        name: 'votes_session_id_idx'
      });

      // Add composite index for authenticated user votes (for single-vote enforcement)
      await queryInterface.addIndex('Votes', ['pollId', 'userId'], {
        name: 'votes_poll_id_user_id_idx'
      });

      // Add composite index for unauthenticated vote tracking
      await queryInterface.addIndex('Votes', ['pollId', 'sessionId'], {
        name: 'votes_poll_id_session_id_idx'
      });

      console.log('Votes table created successfully');
    } else {
      console.log('Votes table already exists, skipping creation');
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    
    // Drop tables in reverse order (respecting foreign key constraints)
    if (tables.includes('Votes')) {
      await queryInterface.dropTable('Votes');
      console.log('Votes table dropped successfully');
    }

    if (tables.includes('PollOptions')) {
      await queryInterface.dropTable('PollOptions');
      
      // Drop enum type
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PollOptions_optionType";');
      } catch (error) {
        console.warn('Warning: Could not drop enum type:', error.message);
      }
      
      console.log('PollOptions table dropped successfully');
    }

    if (tables.includes('Polls')) {
      await queryInterface.dropTable('Polls');
      
      // Drop enum types
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_pollType";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_questionType";');
      } catch (error) {
        console.warn('Warning: Could not drop enum types:', error.message);
      }
      
      console.log('Polls table dropped successfully');
    }
  }
};
