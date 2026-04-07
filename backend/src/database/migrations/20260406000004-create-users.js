'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      email: { 
        type: Sequelize.STRING(100), 
        allowNull: false, 
        unique: true 
      },
      password_hash: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Khớp với YES trong DESCRIBE
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resetToken: { 
        type: Sequelize.STRING(255), 
        allowNull: true 
      },
      resetTokenExpires: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      // Đảm bảo có cả 2 cột timestamps để Sequelize không lỗi khi dùng Model
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};