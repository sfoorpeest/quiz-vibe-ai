const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load biến môi trường từ .env

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: process.env.DB_HOST !== 'localhost' ? {
      ssl: {
        rejectUnauthorized: false // Cần thiết cho các Cloud DB như Aiven
      }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Kiểm tra kết nối
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully via Sequelize.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1); // Thoát app nếu không kết nối được DB
  }
};

module.exports = { sequelize, connectDB };