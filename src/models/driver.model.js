const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Driver extends Model {}

Driver.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
    name: DataTypes.STRING,
    phone: DataTypes.INTEGER,
    document: DataTypes.INTEGER,
    license_category_id: DataTypes.INTEGER,
    license_number: DataTypes.STRING,
    license_expiration: DataTypes.DATE,
    active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    timestamps: false,
  }
);
Driver.associate = (models) => {
  Driver.hasMany(models.VehicleDriverAssignment, { foreignKey: 'driver_id', as: 'assignments' });
  Driver.hasMany(models.Trip, { foreignKey: 'driver_id', as: 'trips' });
  Driver.belongsTo(models.Affiliate, {
    foreignKey: 'company_id',
    as: 'affiliate'
  });
};


module.exports = Driver;