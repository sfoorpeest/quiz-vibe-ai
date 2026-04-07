'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      role_name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true }
    });
  },
  down: async (queryInterface, Sequelize) => await queryInterface.dropTable('roles')
};