const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InspectionItem = sequelize.define('inspection_item', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
}, {
  timestamps: false,
  tableName: 'inspection_items'
});

module.exports = InspectionItem;
