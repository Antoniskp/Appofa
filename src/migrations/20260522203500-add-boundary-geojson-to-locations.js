'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Locations');

    if (!tableDescription.boundary_geojson) {
      await queryInterface.addColumn('Locations', 'boundary_geojson', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Optional per-location GeoJSON boundary (Polygon/MultiPolygon)'
      });
      console.log('boundary_geojson column added to Locations table');
    } else {
      console.log('boundary_geojson column already exists, skipping addition');
    }
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn('Locations', 'boundary_geojson');
    console.log('boundary_geojson column removed from Locations table');
  }
};
