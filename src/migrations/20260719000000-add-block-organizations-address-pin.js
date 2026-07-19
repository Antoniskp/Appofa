'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const columns = await queryInterface.describeTable('Organizations');

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'DO $$ BEGIN ALTER TYPE "enum_Organizations_type" ADD VALUE IF NOT EXISTS \'block\'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;'
      );
    }

    if (!columns.address) {
      await queryInterface.addColumn('Organizations', 'address', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!columns.latitude) {
      await queryInterface.addColumn('Organizations', 'latitude', {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      });
    }

    if (!columns.longitude) {
      await queryInterface.addColumn('Organizations', 'longitude', {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
      });
    }

    const indexes = await queryInterface.showIndex('Organizations');
    const hasCoordinatesIndex = indexes.some((index) => index.name === 'organization_coordinates_index');
    if (!hasCoordinatesIndex) {
      await queryInterface.addIndex('Organizations', ['latitude', 'longitude'], {
        name: 'organization_coordinates_index',
      });
    }

    if (dialect !== 'postgres') {
      const typeColumn = columns.type || {};
      await queryInterface.changeColumn('Organizations', 'type', {
        type: Sequelize.STRING(40),
        allowNull: typeColumn.allowNull ?? false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Organizations');
    const indexes = await queryInterface.showIndex('Organizations');
    const hasCoordinatesIndex = indexes.some((index) => index.name === 'organization_coordinates_index');

    if (hasCoordinatesIndex) {
      await queryInterface.removeIndex('Organizations', 'organization_coordinates_index');
    }

    if (columns.longitude) {
      await queryInterface.removeColumn('Organizations', 'longitude');
    }
    if (columns.latitude) {
      await queryInterface.removeColumn('Organizations', 'latitude');
    }
    if (columns.address) {
      await queryInterface.removeColumn('Organizations', 'address');
    }

    if (queryInterface.sequelize.getDialect() !== 'postgres') {
      await queryInterface.changeColumn('Organizations', 'type', {
        type: Sequelize.STRING(40),
        allowNull: false,
      });
    }

  },
};
