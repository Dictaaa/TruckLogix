// src/models/FuelLog.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class FuelLog extends Model {}

FuelLog.init(
    {
        id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id:       { type: DataTypes.INTEGER, allowNull: false },
        affiliate_id:     { type: DataTypes.INTEGER, allowNull: true },
        vehicle_id:       { type: DataTypes.INTEGER, allowNull: true },
        fuel_date:        { type: DataTypes.DATEONLY, allowNull: false },
        km_initial:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        km_final:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        km_driven:        { type: DataTypes.DECIMAL(10, 2) },   // generada, solo lectura
        gallons:          { type: DataTypes.DECIMAL(8, 3),  allowNull: false },
        price_per_gallon: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        total_value:      { type: DataTypes.DECIMAL(14, 2) },   // generada, solo lectura
        observations:     { type: DataTypes.TEXT, allowNull: true },
        user_id:          { type: DataTypes.INTEGER, allowNull: true },
        active:           { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at:       { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'FuelLog',
        tableName: 'fuel_logs',
        timestamps: false,
    }
);

FuelLog.associate = (models) => {
    FuelLog.belongsTo(models.Vehicle,   { foreignKey: 'vehicle_id',   as: 'vehicle'   });
    FuelLog.belongsTo(models.Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate' });
};

module.exports = FuelLog;