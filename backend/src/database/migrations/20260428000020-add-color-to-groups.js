'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('groups');
    if (!tableInfo.color) {
      await queryInterface.addColumn('groups', 'color', {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: '#06b6d4', // Cyan default
        after: 'description'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('groups', 'color');
  }
};
