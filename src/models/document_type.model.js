// src/models/document_type.model.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class DocumentType extends Model {}

DocumentType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    document_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'DocumentType',
    tableName: 'document_type',
    timestamps: false,
  }
);

module.exports = DocumentType;
