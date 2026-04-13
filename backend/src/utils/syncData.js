const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Xuất toàn bộ bảng materials ra file JSON để đồng bộ team
 */
const syncMaterialsToJson = async () => {
    try {
        // 1. Lấy dữ liệu mới nhất từ DB
        const materials = await sequelize.query(
            'SELECT * FROM materials ORDER BY id ASC',
            { type: QueryTypes.SELECT }
        );

        // 2. Đường dẫn tới file (theo cấu trúc folder của bạn)
        const filePath = path.join(__dirname, '../database/data/materials.json');

        // Đảm bảo thư mục tồn tại
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 3. Ghi file với format đẹp để dễ merge Git
        fs.writeFileSync(filePath, JSON.stringify(materials, null, 2), 'utf8');
        
        console.log(`✅ [Sync] Đã cập nhật ${materials.length} học liệu vào materials.json`);
    } catch (error) {
        console.error('❌ [Sync Error]:', error.message);
    }
};

module.exports = { syncMaterialsToJson };