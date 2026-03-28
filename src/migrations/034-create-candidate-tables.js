'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // PublicPersonProfiles
    await queryInterface.createTable('PublicPersonProfiles', {
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
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL'
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
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('unclaimed', 'pending', 'claimed', 'rejected'),
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
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('moderator', 'application', 'self'),
        defaultValue: 'moderator',
        allowNull: false
      },
      position: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(30)
          : Sequelize.ENUM('mayor', 'prefect', 'parliamentary'),
        allowNull: true
      },
      isActiveCandidate: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      appointedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      appointedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      retiredAt: {
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
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'SET NULL'
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
      position: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(30)
          : Sequelize.ENUM('mayor', 'prefect', 'parliamentary'),
        allowNull: true
      },
      status: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('pending', 'approved', 'rejected'),
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
      publicPersonProfileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
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
    await queryInterface.dropTable('PublicPersonProfiles');
  }
};
