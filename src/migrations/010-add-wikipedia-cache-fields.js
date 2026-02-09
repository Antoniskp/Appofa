'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('Locations');
    
    if (!tableDescription.wikipedia_image_url) {
      await queryInterface.addColumn('Locations', 'wikipedia_image_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Cached Wikipedia main image URL'
      });
      console.log('wikipedia_image_url column added to Locations table');
    } else {
      console.log('wikipedia_image_url column already exists, skipping addition');
    }

    if (!tableDescription.population) {
      await queryInterface.addColumn('Locations', 'population', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Population count from Wikipedia'
      });
      console.log('population column added to Locations table');
    } else {
      console.log('population column already exists, skipping addition');
    }

    if (!tableDescription.wikipedia_data_updated_at) {
      await queryInterface.addColumn('Locations', 'wikipedia_data_updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last Wikipedia data fetch'
      });
      console.log('wikipedia_data_updated_at column added to Locations table');
    } else {
      console.log('wikipedia_data_updated_at column already exists, skipping addition');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Locations', 'wikipedia_data_updated_at');
    console.log('wikipedia_data_updated_at column removed from Locations table');
    
    await queryInterface.removeColumn('Locations', 'population');
    console.log('population column removed from Locations table');
    
    await queryInterface.removeColumn('Locations', 'wikipedia_image_url');
    console.log('wikipedia_image_url column removed from Locations table');
  }
};
