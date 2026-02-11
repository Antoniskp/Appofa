module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Increase URL and text fields to TEXT type to handle long values
      // These commonly exceed 255 characters with OAuth tokens and long URLs
      
      console.log('Migration 014: Increasing VARCHAR(255) fields to TEXT for URL/token fields');
      
      // Helper function to check if table exists
      const tableExists = async (tableName) => {
        try {
          const [results] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = '${tableName}'
            );`
          );
          return results[0].exists;
        } catch (error) {
          return false;
        }
      };
      
      // Users.avatar - Google OAuth avatar URLs can be 300+ characters
      await queryInterface.changeColumn('Users', 'avatar', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      // Articles.bannerImageUrl - URLs can exceed 255 characters
      await queryInterface.changeColumn('Articles', 'bannerImageUrl', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      // Images.url - Image URLs can be long (only if table exists)
      if (await tableExists('Images')) {
        await queryInterface.changeColumn('Images', 'url', {
          type: Sequelize.TEXT,
          allowNull: true
        });
        
        // Images.originalName - File names can be long
        await queryInterface.changeColumn('Images', 'originalName', {
          type: Sequelize.TEXT,
          allowNull: true
        });
      } else {
        console.log('  Skipping Images table (does not exist)');
      }
      
      // PollOptions.displayText - Poll option descriptions can be long
      await queryInterface.changeColumn('PollOptions', 'displayText', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      console.log('✓ Migration 014: All URL/text fields increased to TEXT');
    } catch (error) {
      console.error('Error in migration 014:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Helper function to check if table exists
      const tableExists = async (tableName) => {
        try {
          const [results] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = '${tableName}'
            );`
          );
          return results[0].exists;
        } catch (error) {
          return false;
        }
      };
      
      // Revert to VARCHAR(255)
      await queryInterface.changeColumn('Users', 'avatar', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      await queryInterface.changeColumn('Articles', 'bannerImageUrl', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      // Only revert Images table if it exists
      if (await tableExists('Images')) {
        await queryInterface.changeColumn('Images', 'url', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
        
        await queryInterface.changeColumn('Images', 'originalName', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }
      
      await queryInterface.changeColumn('PollOptions', 'displayText', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    } catch (error) {
      console.error('Error rolling back migration 014:', error);
      throw error;
    }
  }
};
