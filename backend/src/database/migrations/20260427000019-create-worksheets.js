'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Bảng lưu trữ Phiếu học tập (AI sinh ra từ Material)
    await queryInterface.createTable('worksheets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      material_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'materials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.JSON, // Lưu trữ danh sách câu hỏi AI sinh ra (Text, Question type, etc.)
        allowNull: false
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Bảng lưu trữ bài làm của học sinh cho Phiếu học tập
    await queryInterface.createTable('worksheet_submissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      worksheet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'worksheets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      answers: {
        type: Sequelize.JSON, // Lưu câu trả lời của học sinh
        allowNull: false
      },
      feedback: {
        type: Sequelize.TEXT, // AI hoặc Giáo viên nhận xét
        allowNull: true
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      submitted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('worksheet_submissions');
    await queryInterface.dropTable('worksheets');
  }
};
