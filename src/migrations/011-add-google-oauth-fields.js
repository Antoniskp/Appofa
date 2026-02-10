'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Add googleId column if it doesn't exist
    if (!tableDescription.googleId) {
      await queryInterface.addColumn('Users', 'googleId', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      // Add unique constraint separately (SQLite doesn't support unique in addColumn)
      try {
        await queryInterface.addIndex('Users', ['googleId'], {
          unique: true,
          name: 'users_google_id_unique'
        });
      } catch (error) {
        // PostgreSQL: error.name === 'SequelizeDatabaseError' and error.original.code === '42P07'
        // SQLite: error includes 'already exists' or 'UNIQUE'
        const isDuplicateIndex = error.name === 'SequelizeDatabaseError' && 
          (error.original?.code === '42P07' || // PostgreSQL duplicate index
           error.message?.includes('already exists') || 
           error.message?.includes('UNIQUE'));
        
        if (!isDuplicateIndex) {
          throw error;
        }
      }
      console.log('Added googleId column to Users table');
    } else {
      console.log('googleId column already exists in Users table');
    }

    // Add googleAccessToken column if it doesn't exist
    if (!tableDescription.googleAccessToken) {
      await queryInterface.addColumn('Users', 'googleAccessToken', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Added googleAccessToken column to Users table');
    } else {
      console.log('googleAccessToken column already exists in Users table');
    }

    console.log('Google OAuth fields migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Remove googleAccessToken column if it exists
    if (tableDescription.googleAccessToken) {
      await queryInterface.removeColumn('Users', 'googleAccessToken');
      console.log('Removed googleAccessToken column from Users table');
    }

    // Remove googleId column and its unique index if it exists
    if (tableDescription.googleId) {
      // Try to remove the unique index first
      try {
        await queryInterface.removeIndex('Users', 'users_google_id_unique');
      } catch (error) {
        // Ignore if index doesn't exist
      }
      
      await queryInterface.removeColumn('Users', 'googleId');
      console.log('Removed googleId column from Users table');
    }

    console.log('Google OAuth fields rollback completed successfully');
  }
};
