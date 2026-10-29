const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PayrollSettings extends Model {}

PayrollSettings.init({
  company_id: { type: DataTypes.INTEGER, primaryKey: true },
  min_wage: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  health_pension_value: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  holiday_sunday_bonus_pct: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 90 },
  updated_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: 'PayrollSettings',
  tableName: 'payroll_settings',
  timestamps: false,
});

module.exports = PayrollSettings;