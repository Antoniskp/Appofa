'use strict';

/**
 * Migration 038 — Ensure PublicPersonProfiles table exists with all required columns,
 * and ensure CandidateApplications has all columns required by the current model.
 *
 * Root cause: Migration 034 creates BOTH PublicPersonProfiles AND CandidateApplications
 * in a single transaction. If the production DB already had an old CandidateApplications
 * table (from a prior sequelize.sync run), migration 034 would fail on the second
 * createTable call. In PostgreSQL, DDL inside a failed transaction is rolled back,
 * so PublicPersonProfiles was never created even though it was the first step.
 * Migrations 035 and 036 are no-ops when PublicPersonProfiles doesn't exist, so the
 * table remained absent, causing every /api/persons request to return 500.
 *
 * This migration is fully idempotent: it checks column existence before adding and
 * uses ifNotExists for table creation.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();

    // ── 1. Create PublicPersonProfiles if it does not exist ───────────────────
    if (!tables.includes('PublicPersonProfiles')) {
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
    } else {
      // Table already exists — add any columns that may have been missed
      const cols = await queryInterface.describeTable('PublicPersonProfiles');

      if (!cols.position) {
        await queryInterface.addColumn('PublicPersonProfiles', 'position', {
          type: dialect === 'sqlite'
            ? Sequelize.STRING(30)
            : Sequelize.ENUM('mayor', 'prefect', 'parliamentary'),
          allowNull: true
        });
      }
      if (!cols.isActiveCandidate) {
        await queryInterface.addColumn('PublicPersonProfiles', 'isActiveCandidate', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
      if (!cols.appointedAt) {
        await queryInterface.addColumn('PublicPersonProfiles', 'appointedAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
      if (!cols.appointedByUserId) {
        await queryInterface.addColumn('PublicPersonProfiles', 'appointedByUserId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL'
        });
      }
      if (!cols.retiredAt) {
        await queryInterface.addColumn('PublicPersonProfiles', 'retiredAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
    }

    // ── 2. Ensure CandidateApplications has all required columns ─────────────
    if (!tables.includes('CandidateApplications')) return;

    const appCols = await queryInterface.describeTable('CandidateApplications');

    if (!appCols.publicPersonProfileId) {
      await queryInterface.addColumn('CandidateApplications', 'publicPersonProfileId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'SET NULL'
      });
    }

    if (!appCols.position) {
      await queryInterface.addColumn('CandidateApplications', 'position', {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(30)
          : Sequelize.ENUM('mayor', 'prefect', 'parliamentary'),
        allowNull: true
      });
    }

    if (!appCols.candidateProfileId) {
      const colDef = {
        type: Sequelize.INTEGER,
        allowNull: true
      };
      const allTables = await queryInterface.showAllTables();
      if (allTables.includes('CandidateProfiles')) {
        colDef.references = { model: 'CandidateProfiles', key: 'id' };
        colDef.onDelete = 'SET NULL';
      }
      await queryInterface.addColumn('CandidateApplications', 'candidateProfileId', colDef);
    }
  },

  async down() {
    // This migration is intentionally non-destructive on rollback.
    // It creates or fills in tables/columns that were missing due to a failed
    // migration 034. Dropping them here could remove data that pre-dated this
    // migration. Rollbacks for the original schema are handled by migrations
    // 034–037 which own those objects.
  }
};
