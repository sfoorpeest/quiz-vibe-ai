'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Đoạn code tạo bảng phải nằm TRONG này
    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      permission_name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Đoạn code xóa bảng phải nằm TRONG này
    await queryInterface.dropTable('permissions');
  }
};