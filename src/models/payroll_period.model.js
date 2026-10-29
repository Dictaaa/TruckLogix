const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PayrollPeriod extends Model {}

PayrollPeriod.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  fortnight: { type: DataTypes.SMALLINT, allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'abierto' },
  paid_at: { type: DataTypes.DATE, allowNull: true },
  paid_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
  sequelize,
  modelName: 'PayrollPeriod',
  tableName: 'payroll_periods',
  timestamps: false,
});

PayrollPeriod.associate = (models) => {
  PayrollPeriod.hasMany(models.PayrollEntry, { foreignKey: 'payroll_period_id', as: 'entries' });
};

module.exports = PayrollPeriod;