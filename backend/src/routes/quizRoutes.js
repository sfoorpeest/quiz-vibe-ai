const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// 1. Tạo Quiz từ topic bằng AI
router.post('/generate', auth, quizController.createAiQuiz);

// 2. Lưu kết quả làm bài
router.post('/submit', auth, quizController.saveQuizResult);

// 2.1 Lưu kết quả quiz chi tiết (mới)
router.post('/quiz-result', auth, quizController.saveQuizResult);

// 3. Kiểm tra đáp án và xác định cần ôn lại không
router.post('/check-answers', auth, quizController.checkAnswers);

// 4. Lấy bảng xếp hạng (Leaderboard)
router.get('/leaderboard', auth, quizController.getLeaderboard);

// 5. Lấy lịch sử quiz của user hiện tại
router.get('/quiz-history', auth, quizController.getQuizHistory);

// 6. Gợi ý học tập đơn giản theo luật
router.get('/recommendation', auth, quizController.getRecommendation);

module.exports = router;