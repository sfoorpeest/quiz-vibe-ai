'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('materials');
    if (!tableInfo.tags) {
      await queryInterface.addColumn('materials', 'tags', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'content'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('materials');
    if (tableInfo.tags) {
      await queryInterface.removeColumn('materials', 'tags');
    }
  }
};
