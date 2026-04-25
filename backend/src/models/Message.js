const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

/**
 * Model: Message
 * 
 * Đại diện cho một tin nhắn trong hệ thống chat.
 * Hỗ trợ 3 loại (type):
 *   - 'text'     → Tin nhắn văn bản thông thường
 *   - 'file'     → File được upload trực tiếp (PDF, DOCX, TXT ≤ 10MB)
 *   - 'material' → Tài liệu có sẵn trong hệ thống (liên kết qua material_id)
 * 
 * Trạng thái tin nhắn (status):
 *   - 'sent'      → Đã lưu vào DB, người gửi nhận callback xác nhận
 *   - 'delivered' → Người nhận đang online và socket đã emit đến họ
 *   - 'seen'      → Người nhận đã mở cuộc trò chuyện và đọc tin nhắn
 */
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true // Có thể null khi gửi file mà không kèm lời nhắn
    },
    type: {
        type: DataTypes.ENUM('text', 'file', 'material', 'image'),
        defaultValue: 'text'
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Chỉ có giá trị khi type = 'material'
    },
    is_forwarded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // true khi tin nhắn/file được chuyển tiếp từ người dùng khác
    },

    // --- Trạng thái tin nhắn ---
    status: {
        type: DataTypes.ENUM('sent', 'delivered', 'seen'),
        defaultValue: 'sent'
    },

    // --- Thông tin file đính kèm ---
    // Đường dẫn tương đối đến file trên server (ví dụ: /chat-files/1745678901234-doc.pdf)
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    // Tên gốc của file (để hiển thị trên UI)
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // MIME type của file (vd: 'application/pdf', 'text/plain')
    file_type: {
        type: DataTypes.STRING(100),
        allowNull: true
    },

    // Timestamps (camelCase vì migration dùng camelCase cho bảng Messages)
    createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt'
    }
}, {
    tableName: 'Messages',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false // Tắt snake_case vì bảng này dùng camelCase
});

// --- Quan hệ (Associations) ---
// Mỗi tin nhắn thuộc về một người gửi và một người nhận
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

module.exports = Message;
