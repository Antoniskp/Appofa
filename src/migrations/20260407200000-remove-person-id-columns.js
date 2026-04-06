'use strict';

/**
 * Migration: backfill personId → userId/candidateUserId, then drop personId columns.
 *
 * Tables affected:
 *   - DreamTeamVotes:              personId → candidateUserId
 *   - GovernmentCurrentHolders:    personId → userId (then make userId NOT NULL)
 *   - GovernmentPositionSuggestions: personId → userId (then make userId NOT NULL)
 *   - FormationPicks:              personId → candidateUserId
 *
 * Backfill strategy: for rows where personId IS NOT NULL and the target column IS NULL,
 * look up PublicPersonProfile.claimedByUserId (the placeholder User) and set it.
 * Rows that already have the target column set are left untouched.
 *
 * Idempotent: checks column existence before adding/removing.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // ── Helper to check column existence ────────────────────────────────────
    async function columnExists(table, column) {
      const columns = await queryInterface.describeTable(table);
      return !!columns[column];
    }

    // ── Helper: run raw backfill SQL ─────────────────────────────────────────
    // For each affected table/column pair, copy claimedByUserId from the profile
    // to the target column where personId IS NOT NULL and target IS NULL.
    async function backfill(table, targetColumn) {
      if (!(await columnExists(table, 'personId'))) return;
      if (!(await columnExists(table, targetColumn))) return;

      const profilesTable = 'PublicPersonProfiles';
      if (dialect === 'sqlite') {
        // SQLite does not support UPDATE...FROM; use a correlated sub-select instead.
        await queryInterface.sequelize.query(`
          UPDATE "${table}"
          SET "${targetColumn}" = (
            SELECT p."claimedByUserId"
            FROM "${profilesTable}" p
            WHERE p."id" = "${table}"."personId"
          )
          WHERE "personId" IS NOT NULL
            AND "${targetColumn}" IS NULL
            AND EXISTS (
              SELECT 1 FROM "${profilesTable}" p2
              WHERE p2."id" = "${table}"."personId"
                AND p2."claimedByUserId" IS NOT NULL
            )
        `);
      } else {
        // PostgreSQL / standard SQL with UPDATE...FROM
        await queryInterface.sequelize.query(`
          UPDATE "${table}" t
          SET "${targetColumn}" = p."claimedByUserId"
          FROM "${profilesTable}" p
          WHERE t."personId" = p."id"
            AND t."personId" IS NOT NULL
            AND t."${targetColumn}" IS NULL
            AND p."claimedByUserId" IS NOT NULL
        `);
      }
    }

    const tables = await queryInterface.showAllTables();

    // ── 1. DreamTeamVotes ────────────────────────────────────────────────────
    if (tables.includes('DreamTeamVotes')) {
      await backfill('DreamTeamVotes', 'candidateUserId');
      if (await columnExists('DreamTeamVotes', 'personId')) {
        await queryInterface.removeColumn('DreamTeamVotes', 'personId');
      }
    }

    // ── 2. GovernmentCurrentHolders ──────────────────────────────────────────
    if (tables.includes('GovernmentCurrentHolders')) {
      await backfill('GovernmentCurrentHolders', 'userId');
      if (await columnExists('GovernmentCurrentHolders', 'personId')) {
        await queryInterface.removeColumn('GovernmentCurrentHolders', 'personId');
      }
      // Make userId NOT NULL (at least one person reference is now required)
      if (await columnExists('GovernmentCurrentHolders', 'userId')) {
        // First delete any rows that still have userId NULL (orphaned data)
        await queryInterface.sequelize.query(
          'DELETE FROM "GovernmentCurrentHolders" WHERE "userId" IS NULL'
        );
        await queryInterface.changeColumn('GovernmentCurrentHolders', 'userId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
    }

    // ── 3. GovernmentPositionSuggestions ─────────────────────────────────────
    if (tables.includes('GovernmentPositionSuggestions')) {
      await backfill('GovernmentPositionSuggestions', 'userId');
      if (await columnExists('GovernmentPositionSuggestions', 'personId')) {
        await queryInterface.removeColumn('GovernmentPositionSuggestions', 'personId');
      }
      // Make userId NOT NULL
      if (await columnExists('GovernmentPositionSuggestions', 'userId')) {
        // First delete any rows that still have userId NULL
        await queryInterface.sequelize.query(
          'DELETE FROM "GovernmentPositionSuggestions" WHERE "userId" IS NULL'
        );
        await queryInterface.changeColumn('GovernmentPositionSuggestions', 'userId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
    }

    // ── 4. FormationPicks ────────────────────────────────────────────────────
    if (tables.includes('FormationPicks')) {
      await backfill('FormationPicks', 'candidateUserId');
      if (await columnExists('FormationPicks', 'personId')) {
        await queryInterface.removeColumn('FormationPicks', 'personId');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    // Restore the personId columns (no data is restored — this is a destructive migration)
    async function columnExists(table, column) {
      const columns = await queryInterface.describeTable(table);
      return !!columns[column];
    }

    const tables = await queryInterface.showAllTables();

    if (tables.includes('DreamTeamVotes') && !(await columnExists('DreamTeamVotes', 'personId'))) {
      await queryInterface.addColumn('DreamTeamVotes', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    if (tables.includes('GovernmentCurrentHolders')) {
      // Revert NOT NULL on userId
      if (await columnExists('GovernmentCurrentHolders', 'userId')) {
        await queryInterface.changeColumn('GovernmentCurrentHolders', 'userId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
      if (!(await columnExists('GovernmentCurrentHolders', 'personId'))) {
        await queryInterface.addColumn('GovernmentCurrentHolders', 'personId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
    }

    if (tables.includes('GovernmentPositionSuggestions')) {
      if (await columnExists('GovernmentPositionSuggestions', 'userId')) {
        await queryInterface.changeColumn('GovernmentPositionSuggestions', 'userId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
      if (!(await columnExists('GovernmentPositionSuggestions', 'personId'))) {
        await queryInterface.addColumn('GovernmentPositionSuggestions', 'personId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
    }

    if (tables.includes('FormationPicks') && !(await columnExists('FormationPicks', 'personId'))) {
      await queryInterface.addColumn('FormationPicks', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'SET NULL',
      });
    }
  },
};
