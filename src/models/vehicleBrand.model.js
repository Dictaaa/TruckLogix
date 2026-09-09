const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class VehicleBrand extends Model {}

VehicleBrand.init(
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name:       { type: DataTypes.STRING(100), allowNull: false },
        company_id: { type: DataTypes.INTEGER, allowNull: false },
        active:     { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'VehicleBrand',
        tableName: 'vehicle_brands',
        timestamps: false,
    }
);

module.exports = VehicleBrand;