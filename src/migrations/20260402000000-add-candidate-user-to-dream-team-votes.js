'use strict';

/**
 * Safe/idempotent migration: add candidateUserId nullable FK to DreamTeamVotes.
 *
 * This allows users without a PublicPersonProfile to be voted for directly.
 * Either personId (PublicPersonProfile) or candidateUserId (User) must be set on a vote.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('DreamTeamVotes')) return;

    const columns = await queryInterface.describeTable('DreamTeamVotes');
    if (columns.candidateUserId) return; // already applied

    await queryInterface.addColumn('DreamTeamVotes', 'candidateUserId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('DreamTeamVotes')) return;

    const columns = await queryInterface.describeTable('DreamTeamVotes');
    if (!columns.candidateUserId) return;

    await queryInterface.removeColumn('DreamTeamVotes', 'candidateUserId');
  },
};
