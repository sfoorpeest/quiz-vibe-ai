'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('results');

    if (!table.material_id) {
      await queryInterface.addColumn('results', 'material_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'materials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.correct_count) {
      await queryInterface.addColumn('results', 'correct_count', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    if (!table.wrong_count) {
      await queryInterface.addColumn('results', 'wrong_count', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    if (!table.wrong_questions) {
      await queryInterface.addColumn('results', 'wrong_questions', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    if (!table.created_at) {
      await queryInterface.addColumn('results', 'created_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('results');

    if (table.created_at) {
      await queryInterface.removeColumn('results', 'created_at');
    }

    if (table.wrong_questions) {
      await queryInterface.removeColumn('results', 'wrong_questions');
    }

    if (table.wrong_count) {
      await queryInterface.removeColumn('results', 'wrong_count');
    }

    if (table.correct_count) {
      await queryInterface.removeColumn('results', 'correct_count');
    }

    if (table.material_id) {
      await queryInterface.removeColumn('results', 'material_id');
    }
  }
};
