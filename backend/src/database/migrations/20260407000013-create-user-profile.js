'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_profiles', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Quan hệ 1:1, user_id làm khóa chính luôn
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      birth_date: { type: Sequelize.STRING(20), allowNull: true }, // Nên để Date nếu cần tính tuổi
      gender: { type: Sequelize.STRING(10), allowNull: true },
      address: { type: Sequelize.STRING(255), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      avatar_url: { type: Sequelize.STRING(255), allowNull: true },
      notification_email: { type: Sequelize.BOOLEAN, defaultValue: true },
      notification_learning: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_profile_private: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  }
};