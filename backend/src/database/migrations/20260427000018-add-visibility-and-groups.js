'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Thêm cột visibility vào bảng materials
    const tableInfo = await queryInterface.describeTable('materials');
    if (!tableInfo.visibility) {
      await queryInterface.addColumn('materials', 'visibility', {
        type: Sequelize.ENUM('private', 'shared', 'public'),
        defaultValue: 'public',
        allowNull: false,
        after: 'created_by'
      });
    }

    // 2. Tạo bảng groups (Lớp học / Nhóm)
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 3. Tạo bảng group_members (Thành viên lớp)
    await queryInterface.createTable('group_members', {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Tạo bảng group_materials (Học liệu giao cho lớp)
    await queryInterface.createTable('group_materials', {
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
      material_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'materials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm Unique Constraint để tránh trùng lặp
    await queryInterface.addConstraint('group_members', {
      fields: ['group_id', 'user_id'],
      type: 'unique',
      name: 'uq_group_members_group_user'
    });

    await queryInterface.addConstraint('group_materials', {
      fields: ['group_id', 'material_id'],
      type: 'unique',
      name: 'uq_group_materials_group_material'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('group_materials');
    await queryInterface.dropTable('group_members');
    await queryInterface.dropTable('groups');
    await queryInterface.removeColumn('materials', 'visibility');
  }
};
