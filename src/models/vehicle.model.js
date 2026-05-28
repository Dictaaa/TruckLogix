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
    license_plate:      { type: DataTypes.STRING(15), allowNull: false, unique: true },
    brand:      { type: DataTypes.STRING(40), allowNull: false },
    model:      { type: DataTypes.STRING(40), allowNull: false },
    year:      { type: DataTypes.STRING(40), allowNull: false },
    color:      { type: DataTypes.STRING(40), allowNull: false },
    model:      { type: DataTypes.STRING(40), allowNull: false },
    vin_number:      { type: DataTypes.STRING(40), allowNull: false },
    engine_number:      { type: DataTypes.STRING(40), allowNull: false },
    chassis_number:      { type: DataTypes.STRING(40), allowNull: false },
    soat_expiration:      { type: DataTypes.DATE, allowNull: false },
    rtm_expiration:      { type: DataTypes.DATE, allowNull: false },
    company_id:  { type: DataTypes.SMALLINT, allowNull: false },
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
