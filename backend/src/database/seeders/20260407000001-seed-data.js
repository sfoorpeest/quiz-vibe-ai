'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const filePath = path.join(__dirname, '../data/materials.json');

    if (!fs.existsSync(filePath)) return;

    const materials = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const item of materials) {
      // Sử dụng MySQL Raw Query để Upsert nhanh và chính xác ID
      await queryInterface.sequelize.query(
        `INSERT INTO materials (id, title, description, content_url, content, created_by, created_at, updated_at) 
         VALUES (:id, :title, :description, :content_url, :content, :created_by, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE 
         title = VALUES(title), 
         description = VALUES(description), 
         content = VALUES(content), 
         content_url = VALUES(content_url),
         updated_at = VALUES(updated_at)`,
        {
          replacements: {
            id: item.id,
            title: item.title,
            description: item.description || null,
            content_url: item.content_url || null,
            content: item.content || null,
            created_by: item.created_by || 3, // Fallback về ID của bạn
            created_at: item.created_at ? new Date(item.created_at) : new Date(),
            updated_at: item.updated_at ? new Date(item.updated_at) : new Date()
          }
        }
      );
    }
    console.log(`✨ Seed thành công ${materials.length} học liệu từ JSON!`);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('materials', null, {});
  }
};