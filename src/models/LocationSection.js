const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Predefined section types for location pages.
 * Each type has a specific JSON content shape (see doc/LOCATION_SECTIONS.md).
 */
const SECTION_TYPES = [
  'official_links',
  'contacts',
  'people',
  'webcams',
  'announcements'
];

const LocationSection = sequelize.define('LocationSection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'Parent location'
  },
  type: {
    type: DataTypes.ENUM(...SECTION_TYPES),
    allowNull: false,
    comment: 'Predefined section type'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Optional display title override'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Structured JSON content specific to the section type'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the section is visible to the public'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order within the location page'
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
    comment: 'Moderator/admin who created the section'
  },
  updatedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
    comment: 'Moderator/admin who last updated the section'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['locationId', 'sortOrder'],
      name: 'location_sections_location_order_idx'
    },
    {
      fields: ['locationId', 'isPublished'],
      name: 'location_sections_location_published_idx'
    }
  ]
});

LocationSection.SECTION_TYPES = SECTION_TYPES;

module.exports = LocationSection;
