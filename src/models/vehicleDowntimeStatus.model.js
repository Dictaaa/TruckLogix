const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class VehicleDowntimeStatus extends Model {}

VehicleDowntimeStatus.init(
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name:       { type: DataTypes.STRING(100), allowNull: false },
        company_id: { type: DataTypes.INTEGER, allowNull: false },
        is_driver_fault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        active:     { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'VehicleDowntimeStatus',
        tableName: 'vehicle_downtime_statuses',
        timestamps: false,
    }
);

module.exports = VehicleDowntimeStatus;