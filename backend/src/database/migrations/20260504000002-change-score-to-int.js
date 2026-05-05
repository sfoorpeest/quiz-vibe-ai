'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thay đổi kiểu dữ liệu cột score từ DECIMAL(5,2) sang INT 
    // để chứa được điểm số lớn (>999) từ hệ thống multiplier của game.
    await queryInterface.changeColumn('results', 'score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('results', 'score', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
    });
  }
};
