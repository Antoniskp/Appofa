'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CandidateRegistrations', {
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
        onUpdate: 'CASCADE',
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      positionType: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      positionTitle: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      electionCycle: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      partyName: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      isIndependent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      slogan: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      platform: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      websiteUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      contactEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'submitted',
      },
      reviewedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('CandidateRegistrations', ['userId', 'locationId', 'positionType', 'electionCycle'], {
      unique: true,
      name: 'idx_candidate_registrations_unique_active',
    });
    await queryInterface.addIndex('CandidateRegistrations', ['locationId', 'status'], {
      name: 'idx_candidate_registrations_location_status',
    });
    await queryInterface.addIndex('CandidateRegistrations', ['userId'], {
      name: 'idx_candidate_registrations_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CandidateRegistrations');
  },
};
