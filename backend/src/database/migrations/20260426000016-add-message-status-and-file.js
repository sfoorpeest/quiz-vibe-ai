'use strict';

/**
 * Migration: Bổ sung các cột mới cho bảng Messages
 * 
 * Mục tiêu:
 * 1. `status`    - Trạng thái tin nhắn: 'sent' | 'delivered' | 'seen'
 * 2. `file_path` - Đường dẫn tương đối đến file được upload (PDF/DOCX/TXT)
 * 3. `file_name` - Tên gốc của file (để hiển thị trên UI)
 * 4. `file_type` - MIME type của file (vd: 'application/pdf')
 *
 * Workflow trạng thái (status):
 * - 'sent'      → Tin nhắn/file đã lưu vào DB (mặc định)
 * - 'delivered' → Người nhận đang online và đã nhận được qua socket
 * - 'seen'      → Người nhận đã mở cuộc trò chuyện và đọc tin nhắn
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // --- Thêm cột status ---
    await queryInterface.addColumn('Messages', 'status', {
      type: Sequelize.ENUM('sent', 'delivered', 'seen'),
      defaultValue: 'sent',
      allowNull: false,
      // Đặt sau cột `is_forwarded` cho hợp logic
      after: 'is_forwarded'
    });

    // --- Thêm cột file_path ---
    // Lưu đường dẫn tương đối, ví dụ: /chat-files/1745678901234-document.pdf
    // Frontend sẽ ghép với VITE_API_URL để tạo URL download đầy đủ
    await queryInterface.addColumn('Messages', 'file_path', {
      type: Sequelize.STRING(500),
      allowNull: true, // Null khi là tin nhắn text thông thường
      after: 'status'
    });

    // --- Thêm cột file_name ---
    // Tên hiển thị gốc của file trước khi được đổi tên khi lưu
    await queryInterface.addColumn('Messages', 'file_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'file_path'
    });

    // --- Thêm cột file_type ---
    // MIME type để FE biết cách hiển thị icon phù hợp (PDF / Word / TXT)
    await queryInterface.addColumn('Messages', 'file_type', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'file_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Xóa các cột vừa thêm theo thứ tự ngược lại
    await queryInterface.removeColumn('Messages', 'file_type');
    await queryInterface.removeColumn('Messages', 'file_name');
    await queryInterface.removeColumn('Messages', 'file_path');
    await queryInterface.removeColumn('Messages', 'status');
  }
};
