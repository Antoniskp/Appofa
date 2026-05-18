'use strict';

/**
 * Migration: Add anonymous vote support to SuggestionVotes + update voteRestriction enum
 *
 * Changes:
 * 1. SuggestionVotes: make userId nullable, add ipAddress, userAgent, isAuthenticated
 * 2. Suggestions.voteRestriction: add 'anyone' enum value
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // ── SuggestionVotes table changes ─────────────────────────────────────

    const voteColumns = await queryInterface.describeTable('SuggestionVotes');

    if (!voteColumns.ipAddress) {
      await queryInterface.addColumn('SuggestionVotes', 'ipAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!voteColumns.userAgent) {
      await queryInterface.addColumn('SuggestionVotes', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!voteColumns.isAuthenticated) {
      await queryInterface.addColumn('SuggestionVotes', 'isAuthenticated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // Make userId nullable (was NOT NULL)
    await queryInterface.changeColumn('SuggestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // Remove old unique index (userId, targetType, targetId) and recreate with WHERE userId IS NOT NULL
    try {
      await queryInterface.removeIndex('SuggestionVotes', 'unique_user_suggestion_vote');
    } catch (_) { /* ignore if not exists */ }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_user_suggestion_vote
        ON "SuggestionVotes" ("userId", "targetType", "targetId")
        WHERE "userId" IS NOT NULL;
      `);
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_device_vote_per_suggestion
        ON "SuggestionVotes" ("targetType", "targetId", "ipAddress", "userAgent")
        WHERE "userId" IS NULL AND "isAuthenticated" = false;
      `);
    }

    // ── Suggestions.voteRestriction ENUM ─────────────────────────────────

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Suggestions_voteRestriction" ADD VALUE IF NOT EXISTS 'anyone';
      `);
    }
    // SQLite uses STRING, no ENUM change needed
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS unique_device_vote_per_suggestion;
      `);
    }

    try {
      await queryInterface.removeColumn('SuggestionVotes', 'ipAddress');
    } catch (_) { /* ignore */ }

    try {
      await queryInterface.removeColumn('SuggestionVotes', 'userAgent');
    } catch (_) { /* ignore */ }

    try {
      await queryInterface.removeColumn('SuggestionVotes', 'isAuthenticated');
    } catch (_) { /* ignore */ }
  },
};
