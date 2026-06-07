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
};

module.exports = Vehicle;
