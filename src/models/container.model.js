const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Container extends Model {}

Container.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },

  container_size_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
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
  modelName: 'Container',
  tableName: 'containers',
  timestamps: false,
});

Container.associate = (models) => {

  Container.belongsTo(models.ContainerSize, {
    foreignKey: 'container_size_id',
    as: 'containerSize'
  });

};

module.exports = Container;