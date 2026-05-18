'use strict';

/**
 * Migration: Add anonymous vote support to CivicQuestionVotes + update voteRestriction enum
 *
 * Changes:
 * 1. CivicQuestionVotes: make userId nullable, add ipAddress, userAgent, isAuthenticated
 * 2. CivicQuestions.voteRestriction: add 'anyone' enum value
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // ── CivicQuestionVotes table changes ──────────────────────────────────

    const voteColumns = await queryInterface.describeTable('CivicQuestionVotes');

    if (!voteColumns.ipAddress) {
      await queryInterface.addColumn('CivicQuestionVotes', 'ipAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!voteColumns.userAgent) {
      await queryInterface.addColumn('CivicQuestionVotes', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!voteColumns.isAuthenticated) {
      await queryInterface.addColumn('CivicQuestionVotes', 'isAuthenticated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // Make userId nullable (was NOT NULL)
    await queryInterface.changeColumn('CivicQuestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // Remove old unique index (userId, civicQuestionId) and recreate with WHERE userId IS NOT NULL
    try {
      await queryInterface.removeIndex('CivicQuestionVotes', 'unique_user_vote_per_civic_question');
    } catch (_) { /* ignore if not exists */ }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_user_vote_per_civic_question
        ON "CivicQuestionVotes" ("civicQuestionId", "userId")
        WHERE "userId" IS NOT NULL;
      `);
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_device_vote_per_civic_question
        ON "CivicQuestionVotes" ("civicQuestionId", "ipAddress", "userAgent")
        WHERE "userId" IS NULL AND "isAuthenticated" = false;
      `);
    }

    // ── CivicQuestions.voteRestriction ENUM ──────────────────────────────

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_CivicQuestions_voteRestriction" ADD VALUE IF NOT EXISTS 'anyone';
      `);
    }
    // SQLite uses STRING, no ENUM change needed
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS unique_device_vote_per_civic_question;
      `);
    }

    try {
      await queryInterface.removeColumn('CivicQuestionVotes', 'ipAddress');
    } catch (_) { /* ignore */ }

    try {
      await queryInterface.removeColumn('CivicQuestionVotes', 'userAgent');
    } catch (_) { /* ignore */ }

    try {
      await queryInterface.removeColumn('CivicQuestionVotes', 'isAuthenticated');
    } catch (_) { /* ignore */ }
  },
};
