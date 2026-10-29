const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class VehicleDowntime extends Model {}

VehicleDowntime.init(
    {
        id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id:     { type: DataTypes.INTEGER, allowNull: false },
        vehicle_id:     { type: DataTypes.INTEGER, allowNull: false },
        driver_id:      { type: DataTypes.INTEGER, allowNull: true },
        affiliate_id:   { type: DataTypes.INTEGER, allowNull: true },
        status_id:      { type: DataTypes.INTEGER, allowNull: true },
        maintenance_id: { type: DataTypes.INTEGER, allowNull: true },
        downtime_date:  { type: DataTypes.DATEONLY, allowNull: false },
        lost_value:     { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        observations:   { type: DataTypes.TEXT, allowNull: true },
        user_id:        { type: DataTypes.INTEGER, allowNull: true },
        active:         { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at:     { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'VehicleDowntime',
        tableName: 'vehicle_downtime',
        timestamps: false,
    }
);

VehicleDowntime.associate = (models) => {
    VehicleDowntime.belongsTo(models.Vehicle,               { foreignKey: 'vehicle_id',     as: 'vehicle'     });
    VehicleDowntime.belongsTo(models.Driver,                { foreignKey: 'driver_id',      as: 'driver'      });
    VehicleDowntime.belongsTo(models.Affiliate,             { foreignKey: 'affiliate_id',   as: 'affiliate'   });
    VehicleDowntime.belongsTo(models.VehicleDowntimeStatus, { foreignKey: 'status_id',      as: 'status'      });
    VehicleDowntime.belongsTo(models.Maintenance,           { foreignKey: 'maintenance_id', as: 'maintenance' });
};

module.exports = VehicleDowntime;