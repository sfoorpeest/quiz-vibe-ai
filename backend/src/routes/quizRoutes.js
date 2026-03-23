const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware'); // Đảm bảo đã import middleware mới
const quizController = require('../controllers/quizController');

/**
 * @route   POST /api/quizzes/generate
 * @desc    Sử dụng Gemini AI để tạo Quiz và lưu vào Database
 * @access  Private (Chỉ dành cho Teacher và Admin)
 */
router.post(
    '/generate', 
    auth,                   // Bước 1: Xác thực Token (Người dùng thật)
    checkRole([2, 3]),      // Bước 2: Kiểm tra quyền (Chỉ ID 2 - Teacher và ID 3 - Admin)
    quizController.createAiQuiz // Bước 3: Thực thi logic tại Controller
);

module.exports = router;