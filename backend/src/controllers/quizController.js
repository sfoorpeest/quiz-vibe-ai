const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ApiLog = require('../models/ApiLog');
const aiService = require('../services/aiService');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.createAiQuiz = async (req, res) => {
    try {
        const { topic, limit } = req.body;
        const userId = req.user.id;

        // 1. GỌI AI THẬT: Lấy câu hỏi từ Gemini
        // Hàm này giờ sẽ trả về nội dung thật thay vì mảng mẫu
        const questionsFromAi = await aiService.generateQuizFromAI(topic, limit);

        // 2. Tạo Quiz mới trong Database (Sửa: Truncate để không bị hạ tầng DB chặn lỗi Data too long)
        const newQuiz = await Quiz.create({
            title: `Quiz về ${topic}`.substring(0, 255),
            subject: typeof topic === 'string' ? topic.substring(0, 100) : "AI Quiz",
            created_by: userId
        });

        // 3. Lưu các câu hỏi vào bảng questions
        // Đảm bảo map đúng các cột: quiz_id, content, options, correct_answer
        const questionsToSave = questionsFromAi.map(q => ({
            quiz_id: newQuiz.id,
            // Nén lời giải vào content để không cần sửa đổi bảng DB (Wordaround)
            content: q.question + (q.explanation ? `\n\n[EXPLAIN]${q.explanation}` : "") + (q.contentReference ? `\n\n[REF]${q.contentReference}` : ""),
            options: q.options,  // Mảng JSON các lựa chọn
            correct_answer: q.correct_answer // Đáp án đúng
        }));

        await Question.bulkCreate(questionsToSave);

        // 4. Ghi Log API thành công
        await ApiLog.create({
            user_id: userId,
            api_name: 'CREATE_QUIZ_AI',
            request_payload: JSON.stringify(req.body),
            response_text: `Thành công: Đã tạo Quiz ID ${newQuiz.id} với ${questionsToSave.length} câu hỏi thật.`
        });

        res.status(201).json({
            message: "Đã tạo và lưu Quiz thành công với dữ liệu AI thật!",
            quizId: newQuiz.id,
            totalQuestions: questionsToSave.length,
            data: questionsToSave // Trả về để FE có thể hiển thị ngay
        });

    } catch (error) {
        // Ghi log lỗi vào Database để dễ dàng kiểm soát nếu API AI gặp sự cố
        if (req.user) {
            await ApiLog.create({
                user_id: req.user.id,
                api_name: 'CREATE_QUIZ_AI_ERROR',
                request_payload: JSON.stringify(req.body),
                response_text: `Lỗi: ${error.message}`
            });
        }
        console.error("Controller Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 2. Lưu kết quả thi
 */
exports.saveQuizResult = async (req, res) => {
    try {
        const { quizId, score, total } = req.body;
        const userId = req.user.id;

        // Lưu vào bảng results
        // Vì DB hiện tại score là decimal(5,2), ta có thể lưu điểm số thực tế
        await sequelize.query(
            'INSERT INTO results (user_id, quiz_id, score) VALUES (?, ?, ?)',
            {
                replacements: [userId, quizId || null, score],
                type: QueryTypes.INSERT
            }
        );

        // Ghi log hành động hoàn thành Quiz
        await sequelize.query(
            'INSERT INTO learning_history (user_id, quiz_id, action, progress) VALUES (?, ?, ?, ?)',
            {
                replacements: [userId, quizId || null, 'COMPLETED_QUIZ', 100],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({
            status: 'success',
            message: "Đã lưu kết quả thi thành công!"
        });
    } catch (error) {
        console.error("Save Result Error:", error);
        res.status(500).json({ message: "Lỗi khi lưu kết quả thi" });
    }
};

/**
 * 3. Kiểm tra đáp án - quyết định cần ôn lại hay không
 */
exports.checkAnswers = async (req, res) => {
    try {
        const { quizId, selectedAnswers } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
            return res.status(400).json({ message: 'selectedAnswers là bắt buộc' });
        }

        // Lấy các câu hỏi theo thứ tự tạo
        const questions = await sequelize.query(
            'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
            { replacements: [quizId], type: QueryTypes.SELECT }
        );

        const wrongAnswers = [];
        let correctCount = 0;

        selectedAnswers.forEach((selected, idx) => {
            const question = questions[idx];
            if (!question) return;

            // Tách explanation và contentReference từ content
            const explainSplit = question.content.split('\n\n[EXPLAIN]');
            const afterExplain = explainSplit[1] || '';
            const refSplit = afterExplain.split('\n\n[REF]');
            const explanation = refSplit[0].trim();
            const contentReference = (refSplit[1] || 'sec-1').trim();

            if (selected && selected === question.correct_answer) {
                correctCount++;
            } else {
                wrongAnswers.push({
                    questionId: question.id,
                    correctAnswer: question.correct_answer,
                    explanation,
                    contentReference
                });
            }
        });

        // Sai từ 3 câu trở lên → cần ôn lại
        if (wrongAnswers.length >= 3) {
            return res.status(200).json({ retryRequired: true, wrongAnswers });
        }

        // Lưu kết quả khi đạt yêu cầu
        await sequelize.query(
            'INSERT INTO results (user_id, quiz_id, score) VALUES (?, ?, ?)',
            { replacements: [userId, quizId || null, correctCount], type: QueryTypes.INSERT }
        );
        await sequelize.query(
            'INSERT INTO learning_history (user_id, quiz_id, action, progress) VALUES (?, ?, ?, ?)',
            { replacements: [userId, quizId || null, 'COMPLETED_QUIZ', 100], type: QueryTypes.INSERT }
        );

        return res.status(200).json({ retryRequired: false, score: correctCount });
    } catch (error) {
        console.error('Check Answers Error:', error);
        return res.status(500).json({ message: 'Lỗi khi kiểm tra đáp án' });
    }
};

/**
 * 4. Lấy bảng xếp hạng (Leaderboard)
 */
exports.getLeaderboard = async (req, res) => {
    try {
        // Lấy top 10 người có tổng điểm cao nhất hoặc điểm trung bình
        const leaderboard = await sequelize.query(`
            SELECT 
                u.name, 
                COUNT(r.id) as quizzes_taken,
                SUM(r.score) as total_score,
                MAX(r.score) as high_score
            FROM results r
            JOIN users u ON r.user_id = u.id
            GROUP BY u.id
            ORDER BY total_score DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        res.status(200).json({
            status: 'success',
            data: leaderboard
        });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Lỗi khi tải bảng xếp hạng" });
    }
};