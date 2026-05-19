'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'name',
    });

    await queryInterface.sequelize.query(
      "UPDATE users SET username = name WHERE username IS NULL OR username = ''"
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'username');
  },
};
