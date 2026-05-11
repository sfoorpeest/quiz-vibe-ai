'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Thay đổi material_id trong bảng worksheets thành cho phép NULL
    // Chúng ta cần kiểm tra xem cột có tồn tại không trước khi thay đổi (an toàn hơn)
    await queryInterface.changeColumn('worksheets', 'material_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'materials', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 2. Tạo bảng group_worksheets (Phiếu học tập giao cho lớp)
    await queryInterface.createTable('group_worksheets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      worksheet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'worksheets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm Unique Constraint để tránh trùng lặp
    await queryInterface.addConstraint('group_worksheets', {
      fields: ['group_id', 'worksheet_id'],
      type: 'unique',
      name: 'uq_group_worksheets_group_worksheet'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('group_worksheets');
    await queryInterface.changeColumn('worksheets', 'material_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'materials', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
