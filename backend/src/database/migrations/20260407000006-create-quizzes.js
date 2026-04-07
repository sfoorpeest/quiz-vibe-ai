'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quizzes', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      title: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      // Đổi từ description sang subject để khớp Schema image_3fc991.png
      subject: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      // Đổi từ teacher_id sang created_by để khớp Schema image_3fc991.png
      created_by: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        references: { model: 'users', key: 'id' }, 
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' 
      },
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
    await queryInterface.dropTable('quizzes');
  }
};