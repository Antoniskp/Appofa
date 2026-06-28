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

    if (!tableDescription.population_override) {
      await queryInterface.addColumn('Locations', 'population_override', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Moderator-set population override; takes precedence over the Wikipedia-derived population'
      });
      console.log('population_override column added to Locations table');
    } else {
      console.log('population_override column already exists, skipping addition');
    }
  },

  async down(queryInterface, _Sequelize) {
    const tableDescription = await describeTableSafe(queryInterface, 'Locations');

    if (tableDescription.population_override) {
      await removeColumnSafe(queryInterface, 'Locations', 'population_override');
      console.log('population_override column removed from Locations table');
    } else {
      console.log('population_override column does not exist, skipping removal');
    }
  }
};
