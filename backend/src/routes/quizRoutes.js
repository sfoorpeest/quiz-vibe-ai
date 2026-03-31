const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// 1. Tạo Quiz từ topic bằng AI
router.post('/generate', auth, quizController.createAiQuiz);

// 2. Lưu kết quả làm bài
router.post('/submit', auth, quizController.saveQuizResult);

// 3. Lấy bảng xếp hạng (Leaderboard)
router.get('/leaderboard', auth, quizController.getLeaderboard);

module.exports = router;