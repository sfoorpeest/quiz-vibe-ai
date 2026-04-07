'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_logs', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      user_id: { 
        type: Sequelize.INTEGER, 
        references: { model: 'users', key: 'id' }, 
        onUpdate: 'CASCADE', 
        onDelete: 'SET NULL' 
      },
      // Thêm api_name để khớp hoàn toàn Schema cũ
      api_name: { 
        type: Sequelize.STRING(100),
        allowNull: true 
      },
      // Giữ lại endpoint/method vì nó rất quan trọng cho việc debug sau này
      endpoint: { type: Sequelize.STRING(255) },
      method: { type: Sequelize.STRING(10) },
      request_payload: { type: Sequelize.TEXT },
      response_text: { type: Sequelize.TEXT },
      status_code: { type: Sequelize.INTEGER },
      // Đổi thành created_at cho đồng bộ với các bảng khác trong hệ thống
      created_at: { 
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('api_logs');
  }
};