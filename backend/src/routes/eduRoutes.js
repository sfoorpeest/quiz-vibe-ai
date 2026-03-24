const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const { materialValidator, historyValidator } = require('../validators/eduValidator');
const eduController = require('../controllers/eduController');

// 1. Quản lý học liệu (Chỉ Teacher/Admin được đăng)
router.post('/materials', auth, checkRole([2, 3]), materialValidator, eduController.createMaterial);

// 2. Lấy danh sách học liệu (Tất cả user đã đăng nhập đều xem được)
router.get('/materials', auth, eduController.getAllMaterials);

// 3. AI xử lý học liệu (Chỉ Teacher mới có quyền gọi AI tóm tắt)
router.post('/materials/:id/ai-process', auth, checkRole([2, 3]), eduController.processMaterialWithAI);

// 4. Lưu lịch sử học tập (Dành cho Student)
router.post('/learning/track', auth, checkRole([1]), historyValidator, eduController.trackProgress);

module.exports = router;

// 5. Quản trị hệ thống (Chỉ Admin mới có quyền)
// Lấy thống kê tổng quát cho Dashboard
router.get('/admin/stats', auth, checkRole([3]), eduController.getSystemStats);

// Admin có quyền xóa bất kỳ học liệu nào (ví dụ: nội dung vi phạm)
router.delete('/admin/materials/:id', auth, checkRole([3]), eduController.deleteMaterialByAdmin);