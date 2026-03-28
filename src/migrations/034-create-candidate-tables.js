'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // CandidateProfiles
    await queryInterface.createTable('CandidateProfiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      fullName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      constituencyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL'
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      contactEmail: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      socialLinks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      politicalPositions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      manifesto: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      claimStatus: {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('unclaimed', 'pending', 'claimed', 'rejected')
          : Sequelize.STRING(20),
        defaultValue: 'unclaimed',
        allowNull: false
      },
      claimedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      claimRequestedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      claimVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      claimVerifiedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      claimToken: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      claimTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      source: {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('moderator', 'application', 'self')
          : Sequelize.STRING(20),
        defaultValue: 'moderator',
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

    // CandidateApplications
    await queryInterface.createTable('CandidateApplications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      applicantUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      fullName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      constituencyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL'
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contactEmail: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      socialLinks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      politicalPositions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      manifesto: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      supportingStatement: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('pending', 'approved', 'rejected')
          : Sequelize.STRING(20),
        defaultValue: 'pending',
        allowNull: false
      },
      reviewedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      candidateProfileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'CandidateProfiles', key: 'id' },
        onDelete: 'SET NULL'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CandidateApplications');
    await queryInterface.dropTable('CandidateProfiles');
  }
};
