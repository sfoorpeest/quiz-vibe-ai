'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role_permissions', {
      role_id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, // Thêm để khớp Schema
        allowNull: false,
        references: { model: 'roles', key: 'id' }, 
        onDelete: 'CASCADE' 
      },
      permission_id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, // Thêm để khớp Schema
        allowNull: false,
        references: { model: 'permissions', key: 'id' }, 
        onDelete: 'CASCADE' 
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('role_permissions');
  }
};