// src/models/truck.model.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Vehicle extends Model {}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  driver_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
    plate:      { type: DataTypes.STRING(15), allowNull: false, unique: true },
    soat_expiration:      { type: DataTypes.DATE, allowNull: false },
    rtm_expiration:      { type: DataTypes.DATE, allowNull: false },
    active: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'Vehicle',
    tableName: 'vehicles',
    timestamps: false,
  }
);

Vehicle.associate = (models) => {
  Vehicle.hasMany(models.Trip, { foreignKey: 'vehicle_id', as: 'trips' });
  Vehicle.belongsTo(models.Company, {
    foreignKey: 'company_id',
    as: 'company'
  });
  Vehicle.belongsTo(models.Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
  });
};

module.exports = Vehicle;
