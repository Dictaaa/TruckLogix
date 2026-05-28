const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const VehicleInspection = require('./vehicle_inspection.model');
const InspectionItem = require('./inspection_item.model');

const VehicleInspectionItem = sequelize.define('vehicle_inspection_item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inspection_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vehicle_inspection_items_status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notes: {
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
  tableName: 'vehicle_inspection_items'
});

// Relaciones
VehicleInspectionItem.belongsTo(VehicleInspection, { foreignKey: 'inspection_id' });
VehicleInspectionItem.belongsTo(InspectionItem, { foreignKey: 'item_id' });

module.exports = VehicleInspectionItem;
