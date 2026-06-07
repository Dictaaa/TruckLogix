const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Freight extends Model {}

Freight.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  freight_20: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },

  freight_40: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },

  freight_45: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },

  transport_company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  origin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  destination_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  container_size_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  condition_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  modelName: 'Freight',
  tableName: 'freights',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['transport_company_id', 'origin_id', 'destination_id', 'condition_id']
    }
  ]
});

Freight.associate = (models) => {

  Freight.belongsTo(models.TransportCompany, {
    foreignKey: 'transport_company_id',
    as: 'transportCompany'
  });

  Freight.belongsTo(models.Patio, {
    foreignKey: 'origin_id',
    as: 'origin'
  });

  
  Freight.belongsTo(models.Patio, {
    foreignKey: 'destination_id',
    as: 'destination'
  });

  Freight.belongsTo(models.ContainerSize, {
    foreignKey: 'container_size_id',
    as: 'containerSize'
  });
};

module.exports = Freight;