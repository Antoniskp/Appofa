'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Create Suggestions table
    if (!tables.includes('Suggestions')) {
      await queryInterface.createTable('Suggestions', {
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
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        type: {
          type: Sequelize.ENUM('idea', 'problem', 'location_suggestion'),
          defaultValue: 'idea',
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
          type: Sequelize.ENUM('open', 'under_review', 'implemented', 'rejected'),
          defaultValue: 'open',
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

      await queryInterface.addIndex('Suggestions', ['authorId']);
      await queryInterface.addIndex('Suggestions', ['locationId']);
      await queryInterface.addIndex('Suggestions', ['status']);
      await queryInterface.addIndex('Suggestions', ['type']);
      await queryInterface.addIndex('Suggestions', ['createdAt']);

      console.log('Suggestions table created successfully');
    } else {
      console.log('Suggestions table already exists, skipping creation');
    }

    // Create Solutions table
    if (!tables.includes('Solutions')) {
      await queryInterface.createTable('Solutions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        suggestionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Suggestions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
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

      await queryInterface.addIndex('Solutions', ['suggestionId']);
      await queryInterface.addIndex('Solutions', ['authorId']);

      console.log('Solutions table created successfully');
    } else {
      console.log('Solutions table already exists, skipping creation');
    }

    // Create SuggestionVotes table
    if (!tables.includes('SuggestionVotes')) {
      await queryInterface.createTable('SuggestionVotes', {
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
        targetType: {
          type: Sequelize.ENUM('suggestion', 'solution'),
          allowNull: false
        },
        targetId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        value: {
          type: Sequelize.SMALLINT,
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

      // Unique constraint: one vote per user per target
      await queryInterface.addIndex('SuggestionVotes', ['userId', 'targetType', 'targetId'], {
        unique: true,
        name: 'unique_user_suggestion_vote'
      });

      // Index for fast score aggregation
      await queryInterface.addIndex('SuggestionVotes', ['targetType', 'targetId']);

      console.log('SuggestionVotes table created successfully');
    } else {
      console.log('SuggestionVotes table already exists, skipping creation');
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('SuggestionVotes')) {
      await queryInterface.dropTable('SuggestionVotes');

      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SuggestionVotes_targetType";');
      } catch (error) {
        console.warn('Warning: Could not drop enum type:', error.message);
      }

      console.log('SuggestionVotes table dropped successfully');
    }

    if (tables.includes('Solutions')) {
      await queryInterface.dropTable('Solutions');
      console.log('Solutions table dropped successfully');
    }

    if (tables.includes('Suggestions')) {
      await queryInterface.dropTable('Suggestions');

      try {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Suggestions_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Suggestions_status";');
      } catch (error) {
        console.warn('Warning: Could not drop enum types:', error.message);
      }

      console.log('Suggestions table dropped successfully');
    }
  }
};
