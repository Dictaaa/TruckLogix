// const { Sequelize } = require('sequelize');
// const env = require('./envs');

// const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
//   host: env.DB_HOST,
//   port: env.DB_PORT,
//   dialect: 'postgres',
//   logging: false,
//   timezone: '-05:00',
// });

// async function connectDB() {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Conectado a MySQL');
//   } catch (error) {
//     console.error('❌ Error al conectar MySQL:', error);
//   }
// }

// module.exports = { sequelize, connectDB };

const { Sequelize } = require('sequelize');
const env = require('./envs');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a Supabase PostgreSQL');
  } catch (error) {
    console.error('❌ Error al conectar PostgreSQL:', error);
  }
}

module.exports = { sequelize, connectDB };