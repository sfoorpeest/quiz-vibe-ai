'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quiz_tags', {
      quiz_id: { type: Sequelize.INTEGER, references: { model: 'quizzes', key: 'id' }, onDelete: 'CASCADE' },
      tag_id: { type: Sequelize.INTEGER, references: { model: 'tags', key: 'id' }, onDelete: 'CASCADE' }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quiz_tags');
  }
};