'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Roles
    await queryInterface.bulkInsert('roles', [
      { id: 1, role_name: 'Student', description: 'Người học tham gia giải đố' },
      { id: 2, role_name: 'Teacher', description: 'Người tạo đề và quản lý lớp học' },
      { id: 3, role_name: 'Admin', description: 'Quản trị viên hệ thống' }
    ], { ignoreDuplicates: true });

    // 2. Permissions
    await queryInterface.bulkInsert('permissions', [
      { id: 1, permission_name: 'CREATE_QUIZ_AI', description: 'Quyền sử dụng Gemini để tạo câu hỏi trắc nghiệm' },
      { id: 2, permission_name: 'MANAGE_QUIZ', description: 'Quyền sửa/xóa bài trắc nghiệm' },
      { id: 3, permission_name: 'VIEW_STUDENT_RESULTS', description: 'Quyền xem điểm số của sinh viên' },
      { id: 4, permission_name: 'MANAGE_SYSTEM_LOGS', description: 'Quyền xem API Logs và quản trị hệ thống' }
    ], { ignoreDuplicates: true });

    // 3. Role Permissions
    await queryInterface.bulkInsert('role_permissions', [
      { role_id: 2, permission_id: 1 },
      { role_id: 3, permission_id: 1 },
      { role_id: 2, permission_id: 2 },
      { role_id: 3, permission_id: 2 },
      { role_id: 2, permission_id: 3 },
      { role_id: 3, permission_id: 3 },
      { role_id: 3, permission_id: 4 }
    ], { ignoreDuplicates: true });

    // 4. Users
    // Hash a default password 'password123' if needed, or use the hash from the SQL
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      { 
        id: 3, 
        name: 'Nguyễn Văn Làm', 
        email: 'hoanthanh@gmail.com', 
        password_hash: '$2b$10$6jxTwIoF0ukmkmjkxJczpeKtyjg6WGeyAvqr2fNK.flRtZaim9bZ2', 
        role_id: 2, 
        created_at: new Date(),
        updated_at: new Date()
      },
      { 
        id: 4, 
        name: 'Super Admin', 
        email: 'admin@quizai.com', 
        password_hash: passwordHash, 
        role_id: 3, 
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
