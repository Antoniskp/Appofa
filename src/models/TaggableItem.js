const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const dialect = sequelize.getDialect();

const TaggableItem = sequelize.define('TaggableItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  entityType: {
    type: dialect === 'sqlite' ? DataTypes.STRING(50) : DataTypes.ENUM('article', 'poll', 'suggestion'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'TaggableItems',
  indexes: [
    {
      unique: true,
      fields: ['tagId', 'entityType', 'entityId'],
      name: 'taggable_items_unique'
    },
    {
      fields: ['entityType', 'entityId'],
      name: 'taggable_items_entity_idx'
    }
  ]
});

module.exports = TaggableItem;
