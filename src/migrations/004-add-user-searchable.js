'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Add searchable column if it doesn't exist
    if (!tableDescription.searchable) {
      await queryInterface.addColumn('Users', 'searchable', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
      console.log('Added searchable column to Users table');
    } else {
      console.log('searchable column already exists in Users table');
    }

    console.log('Users searchable migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Remove searchable column if it exists
    if (tableDescription.searchable) {
      await queryInterface.removeColumn('Users', 'searchable');
      console.log('Removed searchable column from Users table');
    }

    console.log('Users searchable rollback completed successfully');
  }
};
