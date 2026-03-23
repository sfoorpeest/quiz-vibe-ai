const { DataTypes } = require('sequelize');
// Thêm dấu ngoặc nhọn { } quanh sequelize để lấy đúng instance
const { sequelize } = require('../config/database'); 

const Quiz = sequelize.define('Quiz', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    subject: { type: DataTypes.STRING(100), allowNull: true },
    created_by: { type: DataTypes.INTEGER },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { 
    tableName: 'quizzes', 
    timestamps: false 
});

module.exports = Quiz;