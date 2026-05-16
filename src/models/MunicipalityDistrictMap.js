const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * MunicipalityDistrictMap — join table for the many-to-many relationship
 * between municipalities (or any lower-level Location) and electoral
 * districts (Location with type='electoral_district').
 *
 * Because a municipality may physically span more than one electoral district,
 * a single FK on Location is insufficient; this table captures all valid
 * pairings so candidate assignment and citizen-district resolution remain
 * accurate.
 */
const MunicipalityDistrictMap = sequelize.define('MunicipalityDistrictMap', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  municipalityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'Location (typically municipality) being mapped'
  },
  electoralDistrictId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'Electoral district this municipality belongs to'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['municipalityId', 'electoralDistrictId'],
      name: 'unique_municipality_district_map'
    },
    {
      fields: ['electoralDistrictId'],
      name: 'mdm_electoral_district_index'
    }
  ]
});

module.exports = MunicipalityDistrictMap;
