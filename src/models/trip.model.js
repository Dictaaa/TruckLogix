const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Trip extends Model {}

Trip.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  origin_latitude: DataTypes.DECIMAL(10, 6),
  origin_longitude: DataTypes.DECIMAL(10, 6),
  origin_address: DataTypes.TEXT,
  destination_latitude: DataTypes.DECIMAL(10, 6),
  destination_longitude: DataTypes.DECIMAL(10, 6),
  destination_address: DataTypes.TEXT,
  cargo_type_id: DataTypes.INTEGER,
  container_number: DataTypes.STRING(20),
  cargo_description: DataTypes.TEXT,
  driver_id: DataTypes.INTEGER,
  vehicle_id: DataTypes.INTEGER,
  start_time: DataTypes.DATE,
  end_time: DataTypes.DATE,
  notes: DataTypes.TEXT,
  creator_user_id: DataTypes.INTEGER,
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount : {
    type: DataTypes.DECIMAL(15, 2), 
    allowNull: false,
    defaultValue: 0.00,
  },
  status: DataTypes.INTEGER,
  active: DataTypes.INTEGER,
  
}, {
  sequelize,
  modelName: 'Trip',
  tableName: 'trips',
  timestamps: false,
});

Trip.associate = (models) => {
  Trip.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
  Trip.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
};

module.exports = Trip;
