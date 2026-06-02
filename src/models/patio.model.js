const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Patio extends Model {}

Patio.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

//   address: {
//     type: DataTypes.STRING(250),
//     allowNull: true,
//   },

//   city: {
//     type: DataTypes.STRING(100),
//     allowNull: true,
//   },

//   contact_name: {
//     type: DataTypes.STRING(150),
//     allowNull: true,
//   },

//   contact_phone: {
//     type: DataTypes.STRING(20),
//     allowNull: true,
//   },

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
  modelName: 'Patio',
  tableName: 'patios',
  timestamps: false,
});

module.exports = Patio;