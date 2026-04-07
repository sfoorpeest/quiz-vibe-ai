/** * FLOW GIẢI THÍCH CHO TEAM:
 * 1. Seeder này quét toàn bộ file .json trong thư mục 'src/database/data'.
 * 2. Nó sẽ đọc nội dung văn bản (content) từ các file JSON và đẩy vào bảng 'materials'.
 * 3. Tự động kiểm tra trùng lặp qua ID để tránh lỗi khi chạy lệnh nhiều lần.
 * 
 * "db:migrate": "npx sequelize-cli db:migrate --migrations-path src/database/migrations --config src/config/database.js",
  "db:seed": "npx sequelize-cli db:seed:all --seeders-path src/database/seeders --config src/config/database.js",
  "db:reset": "npx sequelize-cli db:migrate:undo:all --migrations-path src/database/migrations --config src/config/database.js && npm run db:migrate && npm run db:seed"
 */

'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dataDir = path.join(__dirname, '../data');

    // 1. Kiểm tra thư mục data
    if (!fs.existsSync(dataDir)) return;

    // 2. Lấy danh sách tất cả các file .json
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const items = Array.isArray(fileContent) ? fileContent : [fileContent];

      for (const item of items) {
        // 3. Kiểm tra xem Material này đã tồn tại trong DB chưa dựa trên ID
        const exists = await queryInterface.rawSelect('materials', {
          where: { id: item.id },
        }, ['id']);

        if (!exists) {
          await queryInterface.bulkInsert('materials', [{
            id: item.id,
            title: item.title,
            content: item.content,
            created_by: item.created_by || 3, // Mặc định ID là 3 (Nguyễn Văn Làm) theo file SQL của bạn
            created_at: new Date(),
            updated_at: new Date()
          }]);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('materials', null, {});
  }
};