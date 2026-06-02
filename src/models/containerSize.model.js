const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class ContainerSize extends Model {}

ContainerSize.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  size: {
    type: DataTypes.STRING(10),
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
  modelName: 'ContainerSize',
  tableName: 'container_sizes',
  timestamps: false,
});

module.exports = ContainerSize;