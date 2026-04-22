'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' } // Giả sử bảng User của bạn tên 'Users'
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true // Null nếu chỉ gửi tài liệu mà không kèm lời nhắn
      },
      type: {
        type: Sequelize.ENUM('text', 'material', 'image'),
        defaultValue: 'text'
      },
      material_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Chỉ có giá trị khi type là 'material'
        references: { model: 'Materials', key: 'id' }
      },
      is_forwarded: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Messages');
  }
};