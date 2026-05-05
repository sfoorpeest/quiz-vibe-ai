'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('user_profiles', 'featured_badges', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('user_profiles', 'equipped_badge_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'badges', // name of the table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'featured_badges');
    await queryInterface.removeColumn('user_profiles', 'equipped_badge_id');
  }
};
