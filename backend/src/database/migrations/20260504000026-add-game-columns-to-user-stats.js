'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm các cột mới vào user_stats cho Edu Games tracking
    await queryInterface.addColumn('user_stats', 'total_speedruns', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('user_stats', 'total_live_plays', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('user_stats', 'total_solo_plays', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('user_stats', 'current_live_win_streak', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_stats', 'total_speedruns');
    await queryInterface.removeColumn('user_stats', 'total_live_plays');
    await queryInterface.removeColumn('user_stats', 'total_solo_plays');
    await queryInterface.removeColumn('user_stats', 'current_live_win_streak');
  }
};
