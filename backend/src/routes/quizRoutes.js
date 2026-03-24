const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

router.post('/generate', auth, quizController.createAiQuiz);

// Route này dùng để tạo câu hỏi từ AI
router.post('/generate', async (req, res) => {
    try {
        const { topic, limit } = req.body;

        if (!topic) return res.status(400).json({ message: "Vui lòng nhập chủ đề" });

        const quizData = await aiService.generateQuizFromAI(topic, limit);

        res.json({
            success: true,
            topic: topic,
            questions: quizData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;