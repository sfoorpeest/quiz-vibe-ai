const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const UserStat = sequelize.define('UserStat', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    total_quizzes_taken: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_perfect_scores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    current_streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    max_streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_live_wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_monster_kills: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_practice_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_stats',
    timestamps: false
});

module.exports = UserStat;
