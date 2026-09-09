const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class TrailerPlate extends Model {}

TrailerPlate.init(
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        plate:      { type: DataTypes.STRING(20), allowNull: false },
        vehicle_id: { type: DataTypes.INTEGER, allowNull: true },   // vehículo (cabezote) asociado
        company_id: { type: DataTypes.INTEGER, allowNull: false },
        active:     { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE },
    },
    {
        sequelize,
        modelName: 'TrailerPlate',
        tableName: 'trailer_plates',
        timestamps: false,
    }
);

TrailerPlate.associate = (models) => {
    TrailerPlate.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
};

module.exports = TrailerPlate;