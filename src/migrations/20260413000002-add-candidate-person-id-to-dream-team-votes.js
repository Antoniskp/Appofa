'use strict';

/**
 * Adds candidatePersonId (FK → PublicPersonProfiles) to DreamTeamVotes.
 *
 * With this column, votes for unclaimed/pending person profiles are stored using
 * candidatePersonId instead of candidateUserId (which targets real Users).
 * Exactly one of candidateUserId / candidatePersonId must be non-null (enforced
 * in the service layer).
 *
 * candidateUserId is made nullable because votes may now target a person profile
 * directly rather than a User row.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('DreamTeamVotes')) return;

    const columns = await queryInterface.describeTable('DreamTeamVotes');

    // 1. Make candidateUserId nullable
    if (columns.candidateUserId) {
      await queryInterface.changeColumn('DreamTeamVotes', 'candidateUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // 2. Add candidatePersonId column
    if (!columns.candidatePersonId) {
      await queryInterface.addColumn('DreamTeamVotes', 'candidatePersonId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('DreamTeamVotes')) return;

    const columns = await queryInterface.describeTable('DreamTeamVotes');

    // Remove candidatePersonId
    if (columns.candidatePersonId) {
      await queryInterface.removeColumn('DreamTeamVotes', 'candidatePersonId');
    }

    // Restore candidateUserId as NOT NULL
    if (columns.candidateUserId) {
      await queryInterface.changeColumn('DreamTeamVotes', 'candidateUserId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }
  },
};
