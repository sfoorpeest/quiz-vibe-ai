const { DataTypes } = require('sequelize');
// Thêm dấu ngoặc nhọn { } quanh sequelize để lấy đúng instance
const { sequelize } = require('../config/database'); 

const Quiz = sequelize.define('Quiz', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    created_by: { type: DataTypes.INTEGER }
}, { 
    tableName: 'quizzes', 
    timestamps: false 
});

module.exports = Quiz;