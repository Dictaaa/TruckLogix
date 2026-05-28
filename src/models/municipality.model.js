// src/models/municipality.model.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const Department = require('./department.model');

class Municipality extends Model {}

Municipality.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    municipality: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
    },
    status: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'Municipality',
    tableName: 'municipalities',
    timestamps: false,
  }
);

// Relación
Municipality.belongsTo(Department, { foreignKey: 'department_id' });

module.exports = Municipality;
