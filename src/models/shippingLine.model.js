const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class ShippingLine extends Model {}

ShippingLine.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nit: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }

}, {
  sequelize,
  modelName: 'ShippingLine',
  tableName: 'shipping_lines',
  timestamps: false,
});

module.exports = ShippingLine;