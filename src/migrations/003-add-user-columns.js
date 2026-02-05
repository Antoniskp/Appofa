'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Add githubId column if it doesn't exist
    if (!tableDescription.githubId) {
      await queryInterface.addColumn('Users', 'githubId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
      console.log('Added githubId column to Users table');
    } else {
      console.log('githubId column already exists in Users table');
    }

    // Add githubAccessToken column if it doesn't exist
    if (!tableDescription.githubAccessToken) {
      await queryInterface.addColumn('Users', 'githubAccessToken', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added githubAccessToken column to Users table');
    } else {
      console.log('githubAccessToken column already exists in Users table');
    }

    // Add avatar column if it doesn't exist
    if (!tableDescription.avatar) {
      await queryInterface.addColumn('Users', 'avatar', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Added avatar column to Users table');
    } else {
      console.log('avatar column already exists in Users table');
    }

    // Add avatarColor column if it doesn't exist
    if (!tableDescription.avatarColor) {
      await queryInterface.addColumn('Users', 'avatarColor', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Added avatarColor column to Users table');
    } else {
      console.log('avatarColor column already exists in Users table');
    }

    // Add homeLocationId column if it doesn't exist
    if (!tableDescription.homeLocationId) {
      await queryInterface.addColumn('Users', 'homeLocationId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
      console.log('Added homeLocationId column to Users table');
    } else {
      console.log('homeLocationId column already exists in Users table');
    }

    console.log('Users table migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Remove homeLocationId column if it exists
    if (tableDescription.homeLocationId) {
      await queryInterface.removeColumn('Users', 'homeLocationId');
      console.log('Removed homeLocationId column from Users table');
    }

    // Remove avatarColor column if it exists
    if (tableDescription.avatarColor) {
      await queryInterface.removeColumn('Users', 'avatarColor');
      console.log('Removed avatarColor column from Users table');
    }

    // Remove avatar column if it exists
    if (tableDescription.avatar) {
      await queryInterface.removeColumn('Users', 'avatar');
      console.log('Removed avatar column from Users table');
    }

    // Remove githubAccessToken column if it exists
    if (tableDescription.githubAccessToken) {
      await queryInterface.removeColumn('Users', 'githubAccessToken');
      console.log('Removed githubAccessToken column from Users table');
    }

    // Remove githubId column if it exists
    if (tableDescription.githubId) {
      await queryInterface.removeColumn('Users', 'githubId');
      console.log('Removed githubId column from Users table');
    }

    console.log('Users table rollback completed successfully');
  }
};
