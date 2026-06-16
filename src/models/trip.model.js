const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Trip extends Model {}

Trip.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  company_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  transport_company_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  vehicle_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  driver_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  affiliate_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  transport_assistant_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  shipping_line_id: {
    type: DataTypes.INTEGER.UNSIGNED,
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

  trip_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  week_number: DataTypes.INTEGER,
  month_number: DataTypes.INTEGER,
  year_number: DataTypes.INTEGER,

  container_number_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  operation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  client_id: {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: true,
},

  client_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  freight_value: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },

  commission_paid: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },

  work_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  transport_food_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },

  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  invoice_send_date: {
    type: DataTypes.DATEONLY,
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
  modelName: 'Trip',
  tableName: 'trips',
  timestamps: false,
});

Trip.associate = (models) => {

  Trip.belongsTo(models.Company, {
    foreignKey: 'company_id',
    as: 'company'
  });

  Trip.belongsTo(models.Container, {
    foreignKey: 'container_number_id',
    as: 'container'
  });

  Trip.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client'
  });

  Trip.belongsTo(models.TransportCompany, {
    foreignKey: 'transport_company_id',
    as: 'transportCompany'
  });

  Trip.belongsTo(models.Vehicle, {
    foreignKey: 'vehicle_id',
    as: 'vehicle'
  });

  Trip.belongsTo(models.Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
  });

  Trip.belongsTo(models.Affiliate, {
    foreignKey: 'affiliate_id',
    as: 'affiliate'
  });

  Trip.belongsTo(models.TransportAssistant, {
    foreignKey: 'transport_assistant_id',
    as: 'transportAssistant'
  });

  Trip.belongsTo(models.ShippingLine, {
    foreignKey: 'shipping_line_id',
    as: 'shippingLine'
  });

  Trip.belongsTo(models.Patio, {
    foreignKey: 'origin_id',
    as: 'origin'
  });

  
  Trip.belongsTo(models.Patio, {
    foreignKey: 'destination_id',
    as: 'destination'
  });

  Trip.belongsTo(models.Operation, {
    foreignKey: 'operation_id',
    as: 'operation'
  });

};

module.exports = Trip;