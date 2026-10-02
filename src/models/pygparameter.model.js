const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PygParameter extends Model {}

// Función: cada campo necesita su PROPIO objeto (Sequelize los modifica al registrarlos)
const money = () => ({ type: DataTypes.DECIMAL(14, 2), allowNull: true });

PygParameter.init(
    {
        id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id:         { type: DataTypes.INTEGER, allowNull: false },
        vehicle_id:         { type: DataTypes.INTEGER, allowNull: true },   // NULL = general
        valid_from:         { type: DataTypes.DATEONLY, allowNull: false },
        salary:             money(),
        commission_pct:     { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        social_security:    money(),
        satellite:          money(),
        insurance:          money(),
        affiliation:        money(),   // afiliación mensual
        parking:            money(),
        soat:               money(),
        tecnomecanica:      money(),
        dotacion:           money(),
        dotacion_times:     { type: DataTypes.INTEGER, allowNull: true },
        annual_maintenance: money(),
        notes:              { type: DataTypes.STRING(255), allowNull: true },
        user_id:            { type: DataTypes.INTEGER, allowNull: true },
        active:             { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at:         { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'PygParameter',
        tableName: 'pyg_parameters',
        timestamps: false,
    }
);

PygParameter.associate = (models) => {
    PygParameter.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
};

module.exports = PygParameter;