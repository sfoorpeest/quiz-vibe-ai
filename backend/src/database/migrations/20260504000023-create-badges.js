'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('badges', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      tier: {
        type: Sequelize.ENUM('BRONZE', 'SILVER', 'GOLD', 'DIAMOND'),
        defaultValue: 'BRONZE'
      },
      condition_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      condition_value: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('badges');
  }
};
