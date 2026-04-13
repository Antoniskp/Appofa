'use strict';

/**
 * Drops the placeholderUserId column from PublicPersonProfiles.
 *
 * This column was used to track the auto-created placeholder User for an
 * unclaimed profile. Since placeholder users are no longer created, the column
 * is no longer needed.  The claimedByUserId column remains and now only ever
 * points to the real claiming user.
 */
module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('PublicPersonProfiles')) return;

    const columns = await queryInterface.describeTable('PublicPersonProfiles');
    if (columns.placeholderUserId) {
      await queryInterface.removeColumn('PublicPersonProfiles', 'placeholderUserId');
      console.log('Dropped placeholderUserId from PublicPersonProfiles');
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('PublicPersonProfiles')) return;

    const columns = await queryInterface.describeTable('PublicPersonProfiles');
    if (!columns.placeholderUserId) {
      await queryInterface.addColumn('PublicPersonProfiles', 'placeholderUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      });
    }
  },
};
