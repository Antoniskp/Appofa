'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Locations');

    if (!tableDescription.boundary_color) {
      await queryInterface.addColumn('Locations', 'boundary_color', {
        type: Sequelize.STRING(7),
        allowNull: true,
        comment: 'Optional hex color for rendering boundary polygons (e.g. #3b82f6)'
      });
    }

    if (!tableDescription.map_default_center_lat) {
      await queryInterface.addColumn('Locations', 'map_default_center_lat', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Optional map default center latitude used when bounds cannot be derived'
      });
    }

    if (!tableDescription.map_default_center_lng) {
      await queryInterface.addColumn('Locations', 'map_default_center_lng', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Optional map default center longitude used when bounds cannot be derived'
      });
    }

    if (!tableDescription.map_default_zoom) {
      await queryInterface.addColumn('Locations', 'map_default_zoom', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Optional map default zoom used with map_default_center_* as viewport fallback'
      });
    }
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn('Locations', 'map_default_zoom');
    await queryInterface.removeColumn('Locations', 'map_default_center_lng');
    await queryInterface.removeColumn('Locations', 'map_default_center_lat');
    await queryInterface.removeColumn('Locations', 'boundary_color');
  }
};
