// src/models/user.model.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

class User extends Model {
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }
}

User.init(
 {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: DataTypes.STRING(100),
    middle_name: DataTypes.STRING(100),
    last_name: DataTypes.STRING(100),
    second_last_name: DataTypes.STRING(100),
    document_type_id: DataTypes.INTEGER,
    document_number: DataTypes.STRING(50),
    document_file: DataTypes.STRING(255),
    email: {
      type: DataTypes.STRING(150),
      unique: true,
    },
    phone_number_id: DataTypes.INTEGER,
    password: DataTypes.STRING(255),
    profile_picture: DataTypes.STRING(255),
    birth_date: DataTypes.DATEONLY,
    gender_id: DataTypes.INTEGER,
    address: DataTypes.TEXT,
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    postal_code: DataTypes.STRING(20),
    country: DataTypes.STRING(100),
    role: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,
    active: DataTypes.INTEGER,
    created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password'))
          user.password = await bcrypt.hash(user.password, 12);
      },
    },
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: {} },
  }
);

module.exports = User;
