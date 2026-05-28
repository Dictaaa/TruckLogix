const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Driver extends Model {}

Driver.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    license_category_id: DataTypes.INTEGER,
    license_number: DataTypes.STRING,
    license_expiration: DataTypes.DATE,
    status: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  
    status: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    timestamps: false,
  }
);
Driver.associate = (models) => {
  Driver.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Driver.hasMany(models.VehicleDriverAssignment, { foreignKey: 'driver_id', as: 'assignments' });
  Driver.hasMany(models.Trip, { foreignKey: 'driver_id', as: 'trips' });
};


module.exports = Driver;