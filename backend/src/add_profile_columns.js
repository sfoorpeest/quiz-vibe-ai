/**
 * Script thêm các cột Profile vào bảng users
 * Chạy: node src/add_profile_columns.js
 */
require('dotenv').config();
const { sequelize } = require('./config/database');

async function addProfileColumns() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối DB thành công.');

        const columns = [
            { name: 'phone', sql: "ADD COLUMN phone VARCHAR(20) NULL" },
            { name: 'birthDate', sql: "ADD COLUMN birthDate VARCHAR(20) NULL" },
            { name: 'gender', sql: "ADD COLUMN gender VARCHAR(10) NULL" },
            { name: 'address', sql: "ADD COLUMN address VARCHAR(255) NULL" },
            { name: 'bio', sql: "ADD COLUMN bio TEXT NULL" },
            { name: 'avatar', sql: "ADD COLUMN avatar VARCHAR(255) NULL" },
            { name: 'notificationEmail', sql: "ADD COLUMN notificationEmail BOOLEAN DEFAULT TRUE" },
            { name: 'notificationLearning', sql: "ADD COLUMN notificationLearning BOOLEAN DEFAULT TRUE" },
            { name: 'isProfilePrivate', sql: "ADD COLUMN isProfilePrivate BOOLEAN DEFAULT FALSE" },
        ];

        for (const col of columns) {
            try {
                // Kiểm tra cột đã tồn tại chưa
                const [results] = await sequelize.query(
                    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = '${col.name}'`
                );
                if (results.length > 0) {
                    console.log(`  ⏭️  Đã tồn tại: ${col.name}`);
                    continue;
                }
                await sequelize.query(`ALTER TABLE users ${col.sql}`);
                console.log(`  ✅ Thêm cột: ${col.name}`);
            } catch (e) {
                console.log(`  ⚠️  ${col.name}: ${e.message}`);
            }
        }

        console.log('\n🎉 Hoàn tất! Tất cả cột Profile đã sẵn sàng.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

addProfileColumns();
