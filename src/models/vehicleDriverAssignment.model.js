const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class VehicleDriverAssignment extends Model {}

VehicleDriverAssignment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_id: DataTypes.INTEGER,
    driver_id: DataTypes.INTEGER,
    assigned_from: DataTypes.DATE,
    assigned_to: DataTypes.DATE,
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'VehicleDriverAssignment',
    tableName: 'vehicle_driver_assignments',
    timestamps: false,
  }
);

// Asociaciones (debes llamar a esto desde tu index de modelos o setup)
VehicleDriverAssignment.associate = (models) => {
  VehicleDriverAssignment.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  VehicleDriverAssignment.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
};

module.exports = VehicleDriverAssignment;
