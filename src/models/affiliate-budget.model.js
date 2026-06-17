const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class AffiliateBudget extends Model { }

AffiliateBudget.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        affiliate_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        budget: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            allowNull: false,
        },
        company_id: {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
},
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
        modelName: 'AffiliateBudget',
        tableName: 'affiliate_budgets',
        timestamps: false,
    }
);
AffiliateBudget.associate = (models) => {
    AffiliateBudget.belongsTo(models.Affiliate, {
        foreignKey: 'affiliate_id',
        as: 'affiliate'
    });
};

module.exports = AffiliateBudget;