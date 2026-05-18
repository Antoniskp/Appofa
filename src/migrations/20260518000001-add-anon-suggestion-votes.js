'use strict';

/**
 * Add anonymous voting support to SuggestionVotes and update
 * Suggestion.voteRestriction ENUM to include 'anyone'.
 *
 * Changes:
 *  - SuggestionVotes.userId     → nullable (anonymous voters have no userId)
 *  - SuggestionVotes.ipAddress (STRING)           — device fingerprint
 *  - SuggestionVotes.userAgent (STRING 500)       — device fingerprint
 *  - SuggestionVotes.isAuthenticated (BOOLEAN)    — audit flag
 *  - Unique index: (targetType, targetId, ipAddress, userAgent) WHERE userId IS NULL
 *  - Suggestions.voteRestriction ENUM: add 'anyone'
 *
 * Note: Solution voting (targetType = 'solution') remains auth-only at the
 * route/controller level; the schema change is intentionally kept generic.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // ── 1. Make userId nullable ─────────────────────────────────────────────
    await queryInterface.changeColumn('SuggestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // ── 2. Add device-fingerprint columns ───────────────────────────────────
    const existingColumns = await queryInterface.describeTable('SuggestionVotes');

    if (!existingColumns.ipAddress) {
      await queryInterface.addColumn('SuggestionVotes', 'ipAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!existingColumns.userAgent) {
      await queryInterface.addColumn('SuggestionVotes', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!existingColumns.isAuthenticated) {
      await queryInterface.addColumn('SuggestionVotes', 'isAuthenticated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // ── 3. Unique device-fingerprint index (anonymous votes only) ───────────
    try {
      await queryInterface.addConstraint('SuggestionVotes', {
        fields: ['targetType', 'targetId', 'ipAddress', 'userAgent'],
        type: 'unique',
        name: 'unique_device_vote_per_suggestion',
        where: { userId: null },
      });
    } catch {
      // Index may already exist (idempotent re-runs)
    }

    // ── 4. Add 'anyone' to voteRestriction ENUM ─────────────────────────────
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Suggestions_voteRestriction"
          ADD VALUE IF NOT EXISTS 'anyone';
      `);
    }
    // SQLite uses STRING — Sequelize accepts the new value without DDL changes.
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint(
        'SuggestionVotes',
        'unique_device_vote_per_suggestion'
      );
    } catch { /* ignore */ }

    const existingColumns = await queryInterface.describeTable('SuggestionVotes');
    if (existingColumns.isAuthenticated) {
      await queryInterface.removeColumn('SuggestionVotes', 'isAuthenticated');
    }
    if (existingColumns.userAgent) {
      await queryInterface.removeColumn('SuggestionVotes', 'userAgent');
    }
    if (existingColumns.ipAddress) {
      await queryInterface.removeColumn('SuggestionVotes', 'ipAddress');
    }

    await queryInterface.changeColumn('SuggestionVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    });

    // PostgreSQL does not support removing enum values without a full recreate.
  },
};
