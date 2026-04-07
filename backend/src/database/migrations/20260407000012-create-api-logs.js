'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { 
        type: Sequelize.INTEGER, 
        references: { model: 'users', key: 'id' }, 
        onUpdate: 'CASCADE', 
        onDelete: 'SET NULL' 
      },
      endpoint: { type: Sequelize.STRING(255) },
      method: { type: Sequelize.STRING(10) },
      request_payload: { type: Sequelize.TEXT },
      response_text: { type: Sequelize.TEXT },
      status_code: { type: Sequelize.INTEGER },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('api_logs');
  }
};