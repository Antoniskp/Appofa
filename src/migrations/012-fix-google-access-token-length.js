'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Change googleAccessToken to TEXT if column exists
    if (tableDescription.googleAccessToken) {
      await queryInterface.changeColumn('Users', 'googleAccessToken', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Changed googleAccessToken column to TEXT type');
    } else {
      console.log('googleAccessToken column does not exist, skipping');
    }

    // Change githubAccessToken to TEXT if column exists
    if (tableDescription.githubAccessToken) {
      await queryInterface.changeColumn('Users', 'githubAccessToken', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Changed githubAccessToken column to TEXT type');
    } else {
      console.log('githubAccessToken column does not exist, skipping');
    }

    console.log('Access token column type migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Revert googleAccessToken to STRING(255) if column exists
    if (tableDescription.googleAccessToken) {
      await queryInterface.changeColumn('Users', 'googleAccessToken', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      console.log('Reverted googleAccessToken column to STRING(255) type');
    }

    // Revert githubAccessToken to STRING(255) if column exists
    if (tableDescription.githubAccessToken) {
      await queryInterface.changeColumn('Users', 'githubAccessToken', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      console.log('Reverted githubAccessToken column to STRING(255) type');
    }

    console.log('Access token column type rollback completed successfully');
  }
};
