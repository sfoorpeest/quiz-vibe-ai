const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Badge = sequelize.define('Badge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    icon_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    tier: {
        type: DataTypes.ENUM('BRONZE', 'SILVER', 'GOLD', 'DIAMOND'),
        defaultValue: 'BRONZE'
    },
    condition_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    condition_value: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'badges',
    timestamps: false
});

module.exports = Badge;
