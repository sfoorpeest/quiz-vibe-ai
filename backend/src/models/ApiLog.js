const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiLog = sequelize.define('ApiLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER },
    api_name: { type: DataTypes.STRING(100) },
    request_payload: { type: DataTypes.TEXT },
    response_text: { type: DataTypes.TEXT },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { 
    tableName: 'api_logs', 
    timestamps: false 
});

module.exports = ApiLog;