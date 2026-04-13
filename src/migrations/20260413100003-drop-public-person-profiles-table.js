'use strict';

/**
 * Drops the PublicPersonProfiles table after data has been migrated to Users.
 * Also removes the personId FK column from LocationRoles.
 * Also finalizes PersonRemovalRequests by dropping publicPersonProfileId.
 */
module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();

    // ── Remove personId from LocationRoles ────────────────────────────────────
    if (tables.includes('LocationRoles')) {
      const lrCols = await queryInterface.describeTable('LocationRoles');
      if (lrCols.personId) {
        await queryInterface.removeColumn('LocationRoles', 'personId');
      }
      // Remove the index on personId if it exists
      try {
        await queryInterface.removeIndex('LocationRoles', 'idx_location_roles_person_id');
      } catch {
        // Index may not exist
      }
    }

    // ── Finalize PersonRemovalRequests: drop publicPersonProfileId ────────────
    if (tables.includes('PersonRemovalRequests')) {
      const prrCols = await queryInterface.describeTable('PersonRemovalRequests');
      if (prrCols.publicPersonProfileId) {
        // Make userId non-null now that data has been migrated
        await queryInterface.removeColumn('PersonRemovalRequests', 'publicPersonProfileId');
      }
    }

    // ── Drop PublicPersonProfiles ─────────────────────────────────────────────
    if (tables.includes('PublicPersonProfiles')) {
      await queryInterface.dropTable('PublicPersonProfiles');
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();

    // Recreate PublicPersonProfiles (minimal structure for rollback)
    if (!tables.includes('PublicPersonProfiles')) {
      await queryInterface.createTable('PublicPersonProfiles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        firstNameNative: { type: Sequelize.STRING(100), allowNull: false },
        lastNameNative: { type: Sequelize.STRING(100), allowNull: false },
        claimStatus: {
          type: dialect === 'postgres'
            ? Sequelize.ENUM('unclaimed', 'pending', 'claimed', 'rejected')
            : Sequelize.STRING(20),
          defaultValue: 'unclaimed',
          allowNull: false,
        },
        source: {
          type: dialect === 'postgres'
            ? Sequelize.ENUM('moderator', 'application', 'self')
            : Sequelize.STRING(20),
          defaultValue: 'moderator',
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
    }

    // Re-add personId to LocationRoles
    if (tables.includes('LocationRoles')) {
      const lrCols = await queryInterface.describeTable('LocationRoles');
      if (!lrCols.personId) {
        await queryInterface.addColumn('LocationRoles', 'personId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'SET NULL',
        });
      }
    }

    // Re-add publicPersonProfileId to PersonRemovalRequests
    if (tables.includes('PersonRemovalRequests')) {
      const prrCols = await queryInterface.describeTable('PersonRemovalRequests');
      if (!prrCols.publicPersonProfileId) {
        await queryInterface.addColumn('PersonRemovalRequests', 'publicPersonProfileId', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
    }
  },
};
