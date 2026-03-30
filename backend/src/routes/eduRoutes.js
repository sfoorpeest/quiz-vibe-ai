const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const { materialValidator, historyValidator } = require('../validators/eduValidator');
const eduController = require('../controllers/eduController');

// Multer: lưu file vào memory (không ghi ra disk), max 25MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

// 1. Quản lý học liệu (Chỉ Teacher/Admin được đăng)
router.post('/materials', auth, checkRole([2, 3]), materialValidator, eduController.createMaterial);

// 2. Lấy danh sách học liệu qua POST (tránh Cache 304)
router.post('/materials/list', auth, eduController.getAllMaterials);

// 3. AI xử lý học liệu
router.post('/materials/:id/ai-process', auth, checkRole([2, 3]), eduController.processMaterialWithAI);

// 3.5 AI Phân tích Nháp (Dành cho Upload Center khi chưa lưu DB)
router.post('/analyze-draft', auth, checkRole([2, 3]), eduController.analyzeDraftMaterial);

// 3.6 Trích xuất text thật từ File (TXT, DOCX, PDF) hoặc URL rồi gọi AI
router.post('/extract-file', auth, checkRole([2, 3]), upload.single('file'), eduController.extractFileContent);

// 4. Lưu lịch sử học tập (Dành cho Student)
router.post('/learning/track', auth, checkRole([1]), historyValidator, eduController.trackProgress);

// 4.5. Trợ lý AI giải đáp thắc mắc
router.post('/chat', auth, checkRole([1, 2, 3]), eduController.chatWithAI);

// 5. Quản trị hệ thống (Chỉ Admin mới có quyền)
router.get('/admin/stats', auth, checkRole([3]), eduController.getSystemStats);
router.delete('/admin/materials/:id', auth, checkRole([3]), eduController.deleteMaterialByAdmin);

module.exports = router;