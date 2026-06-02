const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Company extends Model {}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING(100),
    nit: DataTypes.STRING(30),
    // document_file: DataTypes.STRING(255),
    // email_id: DataTypes.INTEGER,
    // locations_id: DataTypes.INTEGER,
    // profile_picture: DataTypes.STRING(255),
    // phone_number_id: DataTypes.INTEGER,
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
    modelName: 'Company',
    tableName: 'companies',
    timestamps: false,
  }
);

module.exports = Company;
