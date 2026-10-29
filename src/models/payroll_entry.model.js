const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PayrollEntry extends Model {}

PayrollEntry.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  payroll_period_id: { type: DataTypes.INTEGER, allowNull: false },
  driver_id: { type: DataTypes.INTEGER, allowNull: false },
  company_id: { type: DataTypes.INTEGER, allowNull: false },

  days_worked: { type: DataTypes.INTEGER, allowNull: false },
  min_wage: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  prorated_salary: { type: DataTypes.DECIMAL(15, 2), allowNull: false },

  commission: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  health_pension_value: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },

  loans: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  missed_appointments_value: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  holiday_sunday_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  holiday_sunday_bonus_pct: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 90 },
  holiday_sunday_bonus_unit: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  holiday_sunday_bonus_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },

  total_pay: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },

  created_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: 'PayrollEntry',
  tableName: 'payroll_entries',
  timestamps: false,
});

PayrollEntry.associate = (models) => {
  PayrollEntry.belongsTo(models.PayrollPeriod, { foreignKey: 'payroll_period_id', as: 'period' });
  PayrollEntry.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
};

module.exports = PayrollEntry;