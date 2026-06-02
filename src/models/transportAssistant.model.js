const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class TransportAssistant extends Model {}

TransportAssistant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  document_number: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
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
  modelName: 'TransportAssistant',
  tableName: 'transport_assistants',
  timestamps: false,
});

module.exports = TransportAssistant;