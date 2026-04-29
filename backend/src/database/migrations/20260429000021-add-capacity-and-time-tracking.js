'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Thêm cột capacity vào bảng groups
      const groupTableInfo = await queryInterface.describeTable('groups');
      if (!groupTableInfo.capacity) {
        await queryInterface.addColumn('groups', 'capacity', {
          type: Sequelize.INTEGER,
          defaultValue: 50,
          allowNull: false
        }, { transaction });
      }

      // 2. Thêm cột time_spent vào bảng learning_history
      const historyTableInfo = await queryInterface.describeTable('learning_history');
      if (!historyTableInfo.time_spent) {
        await queryInterface.addColumn('learning_history', 'time_spent', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      // 3. Thêm cột time_taken vào bảng results
      const resultsTableInfo = await queryInterface.describeTable('results');
      if (!resultsTableInfo.time_taken) {
        await queryInterface.addColumn('results', 'time_taken', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const groupTableInfo = await queryInterface.describeTable('groups');
      if (groupTableInfo.capacity) {
        await queryInterface.removeColumn('groups', 'capacity', { transaction });
      }

      const historyTableInfo = await queryInterface.describeTable('learning_history');
      if (historyTableInfo.time_spent) {
        await queryInterface.removeColumn('learning_history', 'time_spent', { transaction });
      }

      const resultsTableInfo = await queryInterface.describeTable('results');
      if (resultsTableInfo.time_taken) {
        await queryInterface.removeColumn('results', 'time_taken', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
