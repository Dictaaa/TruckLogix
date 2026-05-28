const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VehicleInspection = sequelize.define('vehicle_inspection', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  vehicle_id: DataTypes.INTEGER,
  inspector_id: DataTypes.INTEGER,
  inspection_date: DataTypes.DATEONLY,
  odometer: DataTypes.INTEGER,
  observations: DataTypes.TEXT,
  inspection_status: DataTypes.INTEGER,
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  timestamps: false,
  tableName: 'vehicle_inspections'
});

module.exports = VehicleInspection;
