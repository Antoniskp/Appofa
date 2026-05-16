'use strict';

/**
 * Create the MunicipalityDistrictMaps join table.
 *
 * This table implements the many-to-many relationship between municipalities
 * and electoral districts. A municipality may span more than one electoral
 * district, and each electoral district covers one or more municipalities.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MunicipalityDistrictMaps', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      municipalityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        comment: 'Location (typically municipality) being mapped to an electoral district'
      },
      electoralDistrictId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        comment: 'Electoral district location this municipality belongs to'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Prevent duplicate mappings
    await queryInterface.addIndex('MunicipalityDistrictMaps', ['municipalityId', 'electoralDistrictId'], {
      unique: true,
      name: 'unique_municipality_district_map'
    });

    // Index for fast district → municipalities look-ups
    await queryInterface.addIndex('MunicipalityDistrictMaps', ['electoralDistrictId'], {
      name: 'mdm_electoral_district_index'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MunicipalityDistrictMaps');
  }
};
