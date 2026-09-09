const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Maintenance extends Model {}

Maintenance.init(
    {
        id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id:          { type: DataTypes.INTEGER, allowNull: false },   // empresa transportadora
        vehicle_id:          { type: DataTypes.INTEGER, allowNull: true },
        affiliate_id:        { type: DataTypes.INTEGER, allowNull: true },    // = vehicles.company_id
        brand_id:            { type: DataTypes.INTEGER, allowNull: true },
        maintenance_type_id: { type: DataTypes.INTEGER, allowNull: true },
        trailer_plate_id:    { type: DataTypes.INTEGER, allowNull: true },    // FK a trailer_plates
        entry_date:          { type: DataTypes.DATEONLY, allowNull: false },
        exit_date:           { type: DataTypes.DATEONLY, allowNull: true },
        operation_detail:    { type: DataTypes.TEXT, allowNull: false },
        labor_cost:          { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        parts_cost:          { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        total_cost:          { type: DataTypes.DECIMAL(14, 2) },              // columna generada en BD
        user_id:             { type: DataTypes.INTEGER, allowNull: true },
        active:              { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at:          { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'Maintenance',
        tableName: 'maintenances',
        timestamps: false,
    }
);

Maintenance.associate = (models) => {
    Maintenance.belongsTo(models.Vehicle,         { foreignKey: 'vehicle_id',          as: 'vehicle'          });
    Maintenance.belongsTo(models.Affiliate,       { foreignKey: 'affiliate_id',        as: 'affiliate'        });
    Maintenance.belongsTo(models.VehicleBrand,    { foreignKey: 'brand_id',            as: 'brand'            });
    Maintenance.belongsTo(models.MaintenanceType, { foreignKey: 'maintenance_type_id', as: 'maintenanceType'  });
    Maintenance.belongsTo(models.TrailerPlate,    { foreignKey: 'trailer_plate_id',    as: 'trailerPlate'     });
};

module.exports = Maintenance;