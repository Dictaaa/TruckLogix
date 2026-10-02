const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class TripBillingEvent extends Model {}

TripBillingEvent.init(
    {
        id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        trip_id:        { type: DataTypes.INTEGER, allowNull: false },
        company_id:     { type: DataTypes.INTEGER, allowNull: false },
        action:         { type: DataTypes.STRING(30), allowNull: false },
        from_status:    { type: DataTypes.STRING(30), allowNull: true },
        to_status:      { type: DataTypes.STRING(30), allowNull: true },
        temp_order_id:  { type: DataTypes.INTEGER, allowNull: true },
        purchase_order: { type: DataTypes.STRING(60), allowNull: true },
        invoice_number: { type: DataTypes.STRING(60), allowNull: true },
        detail:         { type: DataTypes.STRING(255), allowNull: true },
        user_id:        { type: DataTypes.INTEGER, allowNull: true },
        created_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: 'TripBillingEvent',
        tableName: 'trip_billing_events',
        timestamps: false,
    }
);

TripBillingEvent.associate = (models) => {
    TripBillingEvent.belongsTo(models.Trip,             { foreignKey: 'trip_id',       as: 'trip' });
    TripBillingEvent.belongsTo(models.BillingTempOrder, { foreignKey: 'temp_order_id', as: 'tempOrder' });
};

module.exports = TripBillingEvent;