'use strict';

/**
 * Drops the isPlaceholder column from Users.
 *
 * The placeholder-user pattern has been eliminated: unclaimed PublicPersonProfiles
 * no longer have an associated shadow User row.  All users in the Users table
 * are now real (authenticated) accounts, so the isPlaceholder flag is obsolete.
 */
module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.isPlaceholder) {
      await queryInterface.removeColumn('Users', 'isPlaceholder');
      console.log('Dropped isPlaceholder from Users');
    }
  },

  async down(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.isPlaceholder) {
      await queryInterface.addColumn('Users', 'isPlaceholder', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
};
