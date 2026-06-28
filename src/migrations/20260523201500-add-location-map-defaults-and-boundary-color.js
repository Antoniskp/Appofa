'use strict';

async function describeTableSafe(queryInterface, tableName) {
  try {
    return await queryInterface.describeTable(tableName);
  } catch (error) {
    const dialect = queryInterface.sequelize?.getDialect?.();
    if (dialect !== 'sqlite') {
      throw error;
    }

    const [columns] = await queryInterface.sequelize.query(`PRAGMA table_info(${tableName})`);
    return columns.reduce((description, column) => {
      description[column.name] = column;
      return description;
    }, {});
  }
}

async function removeColumnSafe(queryInterface, tableName, columnName) {
  const dialect = queryInterface.sequelize?.getDialect?.();
  if (dialect === 'sqlite') {
    await queryInterface.sequelize.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
    return;
  }

  await queryInterface.removeColumn(tableName, columnName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await describeTableSafe(queryInterface, 'Locations');

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
    const tableDescription = await describeTableSafe(queryInterface, 'Locations');

    if (tableDescription.map_default_zoom) {
      await removeColumnSafe(queryInterface, 'Locations', 'map_default_zoom');
    }
    if (tableDescription.map_default_center_lng) {
      await removeColumnSafe(queryInterface, 'Locations', 'map_default_center_lng');
    }
    if (tableDescription.map_default_center_lat) {
      await removeColumnSafe(queryInterface, 'Locations', 'map_default_center_lat');
    }
    if (tableDescription.boundary_color) {
      await removeColumnSafe(queryInterface, 'Locations', 'boundary_color');
    }
  }
};
