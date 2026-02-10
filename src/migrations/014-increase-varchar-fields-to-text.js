module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Increase URL and text fields to TEXT type to handle long values
      // These commonly exceed 255 characters with OAuth tokens and long URLs
      
      console.log('Migration 014: Increasing VARCHAR(255) fields to TEXT for URL/token fields');
      
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
      
      // Images.url - Image URLs can be long
      await queryInterface.changeColumn('Images', 'url', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      // Images.originalName - File names can be long
      await queryInterface.changeColumn('Images', 'originalName', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
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
      // Revert to VARCHAR(255)
      await queryInterface.changeColumn('Users', 'avatar', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      await queryInterface.changeColumn('Articles', 'bannerImageUrl', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      await queryInterface.changeColumn('Images', 'url', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      await queryInterface.changeColumn('Images', 'originalName', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
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
