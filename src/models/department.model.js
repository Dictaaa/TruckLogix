// src/models/department.model.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: false,
  }
);

module.exports = Department;
