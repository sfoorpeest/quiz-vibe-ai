'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('questions', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      quiz_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Khớp với YES trong DESCRIBE của bạn
        references: { model: 'quizzes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      options: { 
        type: Sequelize.JSON, 
        allowNull: false // Lưu mảng các lựa chọn [A, B, C, D]
      },
      correct_answer: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      // Thêm timestamps để đồng bộ chuẩn hệ thống
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('questions');
  }
};