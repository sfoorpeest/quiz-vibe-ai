'use strict';

/**
 * Migration: Cập nhật ENUM cho cột `type` trong bảng Messages
 * 
 * Vấn đề: Cột `type` hiện chỉ chấp nhận: 'text', 'material', 'image'
 * Giải pháp: Thêm giá trị 'file' vào ENUM để hỗ trợ gửi file PDF/DOCX/TXT
 * 
 * Lưu ý MySQL: Để thay đổi ENUM, phải dùng raw query ALTER TABLE
 * vì queryInterface.changeColumn không xử lý tốt ENUM trong mọi phiên bản.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`Messages\` MODIFY COLUMN \`type\` ENUM('text', 'file', 'material', 'image') NOT NULL DEFAULT 'text';`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`Messages\` MODIFY COLUMN \`type\` ENUM('text', 'material', 'image') NOT NULL DEFAULT 'text';`
      );
    }
  }
};
