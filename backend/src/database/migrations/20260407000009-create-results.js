'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('results', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      user_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true, // Khớp với YES trong Schema
        references: { model: 'users', key: 'id' }, 
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      quiz_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true, // Khớp với YES trong Schema
        references: { model: 'quizzes', key: 'id' }, 
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      score: { 
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true 
      },
      // Đổi từ completed_at sang submitted_at để khớp 100% Schema cũ
      submitted_at: { 
        type: Sequelize.DATE, 
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('results');
  }
};