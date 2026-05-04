'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_stats', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      total_quizzes_taken: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_perfect_scores: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      current_streak_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      max_streak_days: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_live_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_monster_kills: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_practice_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_stats');
  }
};
