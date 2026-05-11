require('dotenv').config(); // Nạp biến môi trường từ .env

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: true,
    dialectOptions: process.env.DB_HOST !== 'localhost' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: process.env.DB_HOST !== 'localhost' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: process.env.DB_HOST !== 'localhost' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  }
};