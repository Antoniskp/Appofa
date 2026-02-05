'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Locations');
    
    if (tableDescription.wikipedia_url) {
      console.log('wikipedia_url column already exists, skipping addition');
      return;
    }

    await queryInterface.addColumn('Locations', 'wikipedia_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Wikipedia URL for this location'
    });

    console.log('wikipedia_url column added to Locations table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Locations', 'wikipedia_url');
    console.log('wikipedia_url column removed from Locations table');
  }
};
