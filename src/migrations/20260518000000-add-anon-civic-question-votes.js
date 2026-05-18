'use strict';

/**
 * Add anonymous voting support to CivicQuestionVotes and update
 * CivicQuestion.voteRestriction ENUM to include 'anyone'.
 *
 * Changes:
 *  - CivicQuestionVotes.userId  → nullable (anonymous voters have no userId)
 *  - CivicQuestionVotes.ipAddress (STRING)          — device fingerprint
 *  - CivicQuestionVotes.userAgent (STRING 500)      — device fingerprint
 *  - CivicQuestionVotes.isAuthenticated (BOOLEAN)   — audit flag
 *  - Unique index: (civicQuestionId, ipAddress, userAgent) WHERE userId IS NULL
 *  - CivicQuestions.voteRestriction ENUM: add 'anyone'
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // ── 1. Make userId nullable ─────────────────────────────────────────────
    await queryInterface.changeColumn('CivicQuestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // ── 2. Add device-fingerprint columns ───────────────────────────────────
    const existingColumns = await queryInterface.describeTable('CivicQuestionVotes');

    if (!existingColumns.ipAddress) {
      await queryInterface.addColumn('CivicQuestionVotes', 'ipAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!existingColumns.userAgent) {
      await queryInterface.addColumn('CivicQuestionVotes', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!existingColumns.isAuthenticated) {
      await queryInterface.addColumn('CivicQuestionVotes', 'isAuthenticated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // ── 3. Unique device-fingerprint index (anonymous votes only) ───────────
    try {
      await queryInterface.addConstraint('CivicQuestionVotes', {
        fields: ['civicQuestionId', 'ipAddress', 'userAgent'],
        type: 'unique',
        name: 'unique_device_vote_per_civic_question',
        where: { userId: null },
      });
    } catch {
      // Index may already exist (idempotent re-runs)
    }

    // ── 4. Add 'anyone' to voteRestriction ENUM ─────────────────────────────
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_CivicQuestions_voteRestriction"
          ADD VALUE IF NOT EXISTS 'anyone';
      `);
    }
    // SQLite uses STRING — Sequelize accepts the new value without DDL changes.
  },

  async down(queryInterface, Sequelize) {
    // Remove the constraint and columns; userId back to non-nullable.
    try {
      await queryInterface.removeConstraint(
        'CivicQuestionVotes',
        'unique_device_vote_per_civic_question'
      );
    } catch { /* ignore */ }

    const existingColumns = await queryInterface.describeTable('CivicQuestionVotes');
    if (existingColumns.isAuthenticated) {
      await queryInterface.removeColumn('CivicQuestionVotes', 'isAuthenticated');
    }
    if (existingColumns.userAgent) {
      await queryInterface.removeColumn('CivicQuestionVotes', 'userAgent');
    }
    if (existingColumns.ipAddress) {
      await queryInterface.removeColumn('CivicQuestionVotes', 'ipAddress');
    }

    await queryInterface.changeColumn('CivicQuestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // PostgreSQL does not support removing enum values without a full recreate.
  },
};
