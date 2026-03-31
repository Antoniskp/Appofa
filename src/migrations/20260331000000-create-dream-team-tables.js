'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // ── GovernmentPositions ──────────────────────────────────────────────────
    if (!tables.includes('GovernmentPositions')) {
      await queryInterface.createTable('GovernmentPositions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        titleEn: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        positionTypeKey: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        scope: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'national',
        },
        countryCode: {
          type: Sequelize.STRING(5),
          allowNull: false,
          defaultValue: 'GR',
        },
        jurisdictionId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Locations', key: 'id' },
          onDelete: 'SET NULL',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      console.log('GovernmentPositions table created successfully');
    } else {
      console.log('GovernmentPositions table already exists, skipping');
    }

    // ── GovernmentCurrentHolders ─────────────────────────────────────────────
    if (!tables.includes('GovernmentCurrentHolders')) {
      await queryInterface.createTable('GovernmentCurrentHolders', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        positionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'GovernmentPositions', key: 'id' },
          onDelete: 'CASCADE',
        },
        personId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'CASCADE',
        },
        since: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      console.log('GovernmentCurrentHolders table created successfully');
    } else {
      console.log('GovernmentCurrentHolders table already exists, skipping');
    }

    // ── DreamTeamVotes ───────────────────────────────────────────────────────
    if (!tables.includes('DreamTeamVotes')) {
      await queryInterface.createTable('DreamTeamVotes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        },
        positionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'GovernmentPositions', key: 'id' },
          onDelete: 'CASCADE',
        },
        personId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'CASCADE',
        },
        personName: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('DreamTeamVotes', ['userId', 'positionId'], {
        unique: true,
        name: 'unique_user_vote_per_position',
      });

      console.log('DreamTeamVotes table created successfully');
    } else {
      console.log('DreamTeamVotes table already exists, skipping');
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('DreamTeamVotes')) {
      await queryInterface.dropTable('DreamTeamVotes');
      console.log('DreamTeamVotes table dropped successfully');
    }

    if (tables.includes('GovernmentCurrentHolders')) {
      await queryInterface.dropTable('GovernmentCurrentHolders');
      console.log('GovernmentCurrentHolders table dropped successfully');
    }

    if (tables.includes('GovernmentPositions')) {
      await queryInterface.dropTable('GovernmentPositions');
      console.log('GovernmentPositions table dropped successfully');
    }
  },
};
