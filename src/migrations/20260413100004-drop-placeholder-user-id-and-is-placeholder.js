'use strict';

/**
 * Drops the isPlaceholder column from Users (no longer needed since all
 * unclaimed profiles are now identified by claimStatus IS NOT NULL).
 */
module.exports = {
  async up(queryInterface) {
    const userCols = await queryInterface.describeTable('Users');
    if (userCols.isPlaceholder) {
      await queryInterface.removeColumn('Users', 'isPlaceholder');
    }
  },

  async down(queryInterface, Sequelize) {
    const userCols = await queryInterface.describeTable('Users');
    if (!userCols.isPlaceholder) {
      await queryInterface.addColumn('Users', 'isPlaceholder', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
};
