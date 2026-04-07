'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('materials', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      content_url: { type: Sequelize.STRING(500), allowNull: true }, // Khớp Schema
      description: { type: Sequelize.TEXT, allowNull: true },        // Khớp Schema
      content: { type: Sequelize.TEXT, allowNull: true },            // Dùng cho AI xử lý
      created_by: {                                                  // Khớp Schema
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('materials');
  }
};