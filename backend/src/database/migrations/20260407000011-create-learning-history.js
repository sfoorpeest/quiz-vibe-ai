'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('learning_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      action_type: { type: Sequelize.ENUM('VIEWED_MATERIAL', 'STARTED_QUIZ', 'COMPLETED_QUIZ'), allowNull: false },
      target_id: { type: Sequelize.INTEGER },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('learning_history');
  }
};