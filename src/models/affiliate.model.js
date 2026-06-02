const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Affiliate extends Model {}

Affiliate.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING(150),
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
  modelName: 'Affiliate',
  tableName: 'affiliates',
  timestamps: false,
});

module.exports = Affiliate;