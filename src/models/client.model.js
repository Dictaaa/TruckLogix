const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Client extends Model {}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING(100),
    nit: DataTypes.STRING(30),
    active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: false,
  }
);

module.exports = Client;
