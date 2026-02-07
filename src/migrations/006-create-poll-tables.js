'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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
      type: {
        type: Sequelize.ENUM('simple', 'complex'),
        defaultValue: 'simple',
        allowNull: false
      },
      allowUserContributions: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      allowUnauthenticatedVotes: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private', 'locals_only'),
        defaultValue: 'public',
        allowNull: false
      },
      resultsVisibility: {
        type: Sequelize.ENUM('always', 'after_vote', 'after_deadline'),
        defaultValue: 'always',
        allowNull: false
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
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
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'archived'),
        defaultValue: 'active',
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
        text: {
          type: Sequelize.STRING,
          allowNull: true
        },
        photoUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        linkUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        displayText: {
          type: Sequelize.STRING,
          allowNull: true
        },
        answerType: {
          type: Sequelize.ENUM('person', 'article', 'custom'),
          allowNull: true
        },
        addedByUserId: {
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
          defaultValue: 0,
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

      // Add index on pollId
      await queryInterface.addIndex('PollOptions', ['pollId']);

      console.log('PollOptions table created successfully');
    }

    // Create PollVotes table
    if (!tables.includes('PollVotes')) {
      await queryInterface.createTable('PollVotes', {
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
          allowNull: false,
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
          allowNull: false
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

      // Add unique partial index for authenticated users (one vote per user per poll)
      // Use raw SQL because partial indexes require native database syntax
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX "unique_user_vote_per_poll" ON "PollVotes" ("pollId", "userId") WHERE "userId" IS NOT NULL;'
      );

      // Add index on pollId and sessionId
      await queryInterface.addIndex('PollVotes', ['pollId', 'sessionId']);

      console.log('PollVotes table created successfully');
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (to handle foreign key constraints)
    const tables = await queryInterface.showAllTables();
    
    // Drop PollVotes table first (has foreign keys to Polls and PollOptions)
    if (tables.includes('PollVotes')) {
      await queryInterface.dropTable('PollVotes');
      console.log('PollVotes table dropped successfully');
    }

    // Drop PollOptions table (has foreign key to Polls)
    if (tables.includes('PollOptions')) {
      await queryInterface.dropTable('PollOptions');
      
      // Drop enum type for PollOptions
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PollOptions_answerType";');
      } catch (error) {
        console.warn('Warning: Could not drop enum type:', error.message);
      }
      
      console.log('PollOptions table dropped successfully');
    }

    // Drop Polls table
    if (tables.includes('Polls')) {
      await queryInterface.dropTable('Polls');
      
      // Drop enum types for Polls
      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_visibility";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_resultsVisibility";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_status";');
      } catch (error) {
        console.warn('Warning: Could not drop enum types:', error.message);
      }
      
      console.log('Polls table dropped successfully');
    }
  }
};
