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
    const tableDescription = await describeTableSafe(queryInterface, 'Locations');

    if (tableDescription.boundary_geojson) {
      await removeColumnSafe(queryInterface, 'Locations', 'boundary_geojson');
      console.log('boundary_geojson column removed from Locations table');
    } else {
      console.log('boundary_geojson column does not exist, skipping removal');
    }
  }
};
