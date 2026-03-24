const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const quizController = require('../controllers/quizController');
const { createQuizValidator } = require('../validators/quizValidator');

/**
 * Lộ trình tạo Quiz AI
 * Luồng xử lý: 
 * 1. auth: Kiểm tra Token (Đã đăng nhập chưa?)
 * 2. checkRole: Kiểm tra quyền (Có phải Teacher/Admin không?)
 * 3. createQuizValidator: Kiểm tra dữ liệu (Topic có hợp lệ không? Limit có quá cao không?)
 * 4. createAiQuiz: Thực thi gọi Gemini AI và lưu DB.
 */
router.post(
    '/generate', 
    auth, 
    checkRole([2, 3]), 
    createQuizValidator, 
    quizController.createAiQuiz 
);

module.exports = router;