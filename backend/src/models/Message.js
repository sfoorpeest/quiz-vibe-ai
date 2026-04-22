const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User'); // Import User model để thiết lập quan hệ

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
        allowNull: true // Có thể null nếu chỉ gửi material
    },
    type: {
        type: DataTypes.ENUM('text', 'material', 'image'),
        defaultValue: 'text'
    },
    material_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Chỉ có khi type = 'material'
    },
    is_forwarded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
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
    underscored: false // Tắt gạch dưới cho riêng bảng này vì migration đã dùng camelCase
});

// Thiết lập quan hệ (Associations)
// Một tin nhắn thuộc về một người gửi
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });
// Một tin nhắn thuộc về một người nhận
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

module.exports = Message;
