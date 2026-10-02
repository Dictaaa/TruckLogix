const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class BillingTempOrder extends Model {}

BillingTempOrder.init(
    {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        company_id: { type: DataTypes.INTEGER, allowNull: false },
        code:       { type: DataTypes.STRING(20), allowNull: true, unique: true },
        notes:      { type: DataTypes.STRING(255), allowNull: true },
        user_id:    { type: DataTypes.INTEGER, allowNull: true },
        active:     { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: 'BillingTempOrder',
        tableName: 'billing_temp_orders',
        timestamps: false,
    }
);

BillingTempOrder.associate = (models) => {
    BillingTempOrder.hasMany(models.Trip, { foreignKey: 'temp_order_id', as: 'trips' });
};

module.exports = BillingTempOrder;