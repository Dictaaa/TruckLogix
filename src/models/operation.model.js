const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Operation extends Model {}

Operation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }

}, {
  sequelize,
  modelName: 'Operation',
  tableName: 'operations',
  timestamps: false,
});

module.exports = Operation;