require('dotenv').config({ path: '../.env' });
const { sequelize } = require('./config/database'); 

async function addTimeTakenColumn() {
  try {
    console.log('Bắt đầu thêm cột time_taken vào bảng results...');
    
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'results' 
      AND COLUMN_NAME = 'time_taken'
    `);

    if (columns.length === 0) {
      await sequelize.query('ALTER TABLE results ADD COLUMN time_taken INT DEFAULT 0');
      console.log('Đã thêm cột time_taken thành công!');
    } else {
      console.log('Cột time_taken đã tồn tại.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi thêm cột time_taken:', error);
    process.exit(1);
  }
}

addTimeTakenColumn();
