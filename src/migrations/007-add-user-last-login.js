'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Add lastLoginAt column if it doesn't exist
    if (!tableDescription.lastLoginAt) {
      await queryInterface.addColumn('Users', 'lastLoginAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Added lastLoginAt column to Users table');
    } else {
      console.log('lastLoginAt column already exists in Users table');
    }

    console.log('Users lastLoginAt migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Remove lastLoginAt column if it exists
    if (tableDescription.lastLoginAt) {
      await queryInterface.removeColumn('Users', 'lastLoginAt');
      console.log('Removed lastLoginAt column from Users table');
    }

    console.log('Users lastLoginAt rollback completed successfully');
  }
};
