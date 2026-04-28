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
router.put('/materials/:id/visibility', auth, checkRole([2, 3]), eduController.updateMaterialVisibility);

// 1.2 Lấy danh sách giáo viên và chia sẻ tài liệu
router.get('/teachers', auth, checkRole([2, 3]), eduController.getTeachers);
router.post('/materials/:id/share', auth, checkRole([2, 3]), eduController.shareMaterialToTeachers);

// 1.5 Tìm kiếm học liệu theo tiêu đề hoặc tag (@tag / #tag)
router.get('/materials/search', auth, eduController.searchMaterials);

// 2. Lấy danh sách học liệu qua POST (tránh Cache 304)
router.post('/materials/list', auth, eduController.getAllMaterials);

// 3. AI xử lý học liệu
router.post('/materials/:id/ai-process', auth, checkRole([2, 3]), eduController.processMaterialWithAI);

// 3.5 AI Phân tích Nháp (Dành cho Upload Center khi chưa lưu DB)
router.post('/analyze-draft', auth, checkRole([2, 3]), eduController.analyzeDraftMaterial);

// 3.6 Trích xuất text thật từ File (TXT, DOCX, PDF) hoặc URL rồi gọi AI
router.post('/extract-file', auth, checkRole([2, 3]), upload.single('file'), eduController.extractFileContent);

// 4. Lưu lịch sử học tập (Dành cho Student)
router.post('/learning/track', auth, checkRole([1, 2, 3]), historyValidator, eduController.trackProgress);

// 4.1 Lấy tiến độ hiện tại của một học liệu
router.get('/learning/progress/:material_id', auth, eduController.getMaterialProgress);

// 4.2 Lấy dữ liệu Dashboard cho trang Home
router.get('/dashboard/stats', auth, eduController.getUserDashboard);

// 4.5. Trợ lý AI giải đáp thắc mắc
router.post('/chat', auth, checkRole([1, 2, 3]), eduController.chatWithAI);

// 5. Quản lý lớp học (Chỉ Teacher/Admin)
router.post('/groups', auth, checkRole([2, 3]), eduController.createGroup);
router.get('/groups', auth, checkRole([2, 3]), eduController.getTeacherGroups);
router.get('/groups/:id', auth, checkRole([2, 3]), eduController.getGroupDetails);
router.delete('/groups/:id', auth, checkRole([2, 3]), eduController.deleteGroup);

router.get('/students', auth, checkRole([2, 3]), eduController.getStudentsForTeacher);
router.post('/groups/members', auth, checkRole([2, 3]), eduController.addGroupMembers);
router.delete('/groups/:id/members/:studentId', auth, checkRole([2, 3]), eduController.removeGroupMember);
router.post('/groups/assign', auth, checkRole([2, 3]), eduController.assignMaterialToGroup);

// 5.1 Quản lý lớp học (Dành cho Học sinh)
router.get('/student/groups', auth, checkRole([1]), eduController.getStudentGroups);

// 6. Phiếu học tập (Worksheets)
router.get('/worksheets/all', auth, checkRole([2, 3]), eduController.getAllWorksheetsForTeacher);
router.get('/worksheets/public/:id', eduController.getWorksheetById);
router.get('/worksheets/assigned', auth, checkRole([1]), eduController.getWorksheetsForStudent);
router.post('/worksheets/generate', auth, checkRole([2, 3]), eduController.generateWorksheetWithAI);
router.post('/worksheets/submit', auth, checkRole([1, 2, 3]), eduController.submitWorksheet);
router.get('/worksheets/material/:material_id', auth, eduController.getWorksheetsByMaterial);

// 7. Quản trị hệ thống (Chỉ Admin mới có quyền)
router.get('/admin/stats', auth, checkRole([3]), eduController.getSystemStats);
router.delete('/admin/materials/:id', auth, checkRole([3]), eduController.deleteMaterialByAdmin);

// 6. Google TTS Proxy (Chị Google - Ổn định nhất)
const axios = require('axios');
router.get('/tts', auth, async (req, res) => {
  try {
    const { text, lang = 'vi' } = req.query;
    if (!text) return res.status(400).json({ error: 'Missing text parameter' });

    // Sử dụng endpoint Google Translate TTS ổn định
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      }
    });

    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('TTS Proxy error:', err.message);
    res.status(500).json({ error: 'TTS proxy failed' });
  }
});

module.exports = router;