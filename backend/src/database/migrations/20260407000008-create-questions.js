'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('questions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      quiz_id: {
        type: Sequelize.INTEGER,
        references: { model: 'quizzes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { type: Sequelize.TEXT, allowNull: true },
      options: { type: Sequelize.JSON, allowNull: false }, // Sequelize sẽ tự hiểu mảng ["A", "B"]
      correct_answer: { type: Sequelize.TEXT, allowNull: true }
    });
  },
  down: async (queryInterface, Sequelize) => await queryInterface.dropTable('questions')
};