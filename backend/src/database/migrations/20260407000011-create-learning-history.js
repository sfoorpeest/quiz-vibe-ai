'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('learning_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        references: { model: 'users', key: 'id' }, 
        onDelete: 'CASCADE' 
      },
      material_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true, 
        references: { model: 'materials', key: 'id' }, 
        onDelete: 'SET NULL' 
      },
      quiz_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true, 
        references: { model: 'quizzes', key: 'id' }, 
        onDelete: 'SET NULL' 
      },
      action: { 
        type: Sequelize.ENUM('VIEWED_MATERIAL', 'STARTED_QUIZ', 'COMPLETED_QUIZ'), 
        allowNull: false 
      },
      progress: { 
        type: Sequelize.TINYINT, 
        defaultValue: 0 
      },
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('learning_history');
  }
};