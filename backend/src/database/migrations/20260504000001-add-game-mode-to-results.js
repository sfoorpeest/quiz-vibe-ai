'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('results');
    if (!tableInfo.game_mode) {
      await queryInterface.addColumn('results', 'game_mode', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'PRACTICE' // Mặc định là luyện tập thường
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('results');
    if (tableInfo.game_mode) {
      await queryInterface.removeColumn('results', 'game_mode');
    }
  }
};
