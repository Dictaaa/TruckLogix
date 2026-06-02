const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class TransportCompany extends Model {}

TransportCompany.init({
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
  modelName: 'TransportCompany',
  tableName: 'transport_companies',
  timestamps: false,
});

module.exports = TransportCompany;