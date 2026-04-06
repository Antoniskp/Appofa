'use strict';

/**
 * Adds two new columns:
 *   - Users.isPlaceholder (BOOLEAN, default false) — marks auto-created placeholder accounts
 *     for unclaimed PublicPersonProfiles that have not yet been claimed by a real user.
 *   - PublicPersonProfiles.placeholderUserId (INTEGER, FK → Users.id) — permanent reference to
 *     the placeholder User even after a real claim is in progress (claimedByUserId changes).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add isPlaceholder to Users
    const userColumns = await queryInterface.describeTable('Users');
    if (!userColumns.isPlaceholder) {
      await queryInterface.addColumn('Users', 'isPlaceholder', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      console.log('Added isPlaceholder column to Users table');
    }

    // 2. Add placeholderUserId to PublicPersonProfiles
    const tables = await queryInterface.showAllTables();
    if (tables.includes('PublicPersonProfiles')) {
      const profileColumns = await queryInterface.describeTable('PublicPersonProfiles');
      if (!profileColumns.placeholderUserId) {
        await queryInterface.addColumn('PublicPersonProfiles', 'placeholderUserId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
        });
        console.log('Added placeholderUserId column to PublicPersonProfiles table');
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('PublicPersonProfiles')) {
      const profileColumns = await queryInterface.describeTable('PublicPersonProfiles');
      if (profileColumns.placeholderUserId) {
        await queryInterface.removeColumn('PublicPersonProfiles', 'placeholderUserId');
      }
    }

    const userColumns = await queryInterface.describeTable('Users');
    if (userColumns.isPlaceholder) {
      await queryInterface.removeColumn('Users', 'isPlaceholder');
    }
  },
};
