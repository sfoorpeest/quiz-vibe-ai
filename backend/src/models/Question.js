const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Nhớ có { }

const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quiz_id: { type: DataTypes.INTEGER },
    content: { type: DataTypes.TEXT, allowNull: false },
    options: { type: DataTypes.JSON },
    correct_answer: { type: DataTypes.TEXT }
}, { 
    tableName: 'questions', 
    timestamps: false 
});

module.exports = Question;