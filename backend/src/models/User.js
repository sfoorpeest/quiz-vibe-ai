const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // --- Reset Password (Cột này bắt buộc phải khớp DB) ---
    resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'resetToken' 
    },
    resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'resetTokenExpires'
    }
}, {
    tableName: 'users',
    timestamps: false 
});

module.exports = User;