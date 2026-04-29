'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_item_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      item_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      item_type: {
        type: Sequelize.ENUM('material', 'assignment'),
        allowNull: false
      },
      is_saved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('user_item_actions', {
      fields: ['user_id', 'item_id', 'item_type'],
      type: 'unique',
      name: 'uq_user_item_actions_user_item_type'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_item_actions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_user_item_actions_item_type;').catch(() => {});
  }
};