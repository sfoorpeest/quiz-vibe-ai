const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ApiLog = require('../models/ApiLog');
const aiService = require('../services/aiService');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const badgeChecker = require('../services/badgeChecker');

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
 * 1.5. Tạo Random Quiz cho Solo Adventure (Sinh tồn vô cực)
 * Dùng endpoint riêng không lưu vào bảng Quiz gốc để tránh rác DB nếu user chỉ chơi 1-2 câu.
 */
exports.generateRandomQuiz = async (req, res) => {
    try {
        const { limit = 5 } = req.body;
        const questionsFromAi = await aiService.generateRandomQuizFromAI(limit);

        const questionsToReturn = questionsFromAi.map(q => ({
            content: q.question + (q.explanation ? `\n\n[EXPLAIN]${q.explanation}` : ""),
            options: q.options,
            correct_answer: q.correct_answer
        }));

        res.status(200).json({
            message: "Đã tạo câu hỏi ngẫu nhiên thành công!",
            data: questionsToReturn
        });
    } catch (error) {
        console.error("Random Quiz Controller Error:", error.message);
        res.status(500).json({ error: "Lỗi khi sinh câu hỏi ngẫu nhiên." });
    }
};

/**
 * 2. Lưu kết quả thi
 */
exports.saveQuizResult = async (req, res) => {
    try {
        const {
            quizId,
            materialId,
            score,
            total,
            correctCount,
            wrongCount,
            wrongQuestions
        } = req.body;
        const userId = req.user.id;

        const resolvedCorrectCount = Number.isInteger(correctCount)
            ? correctCount
            : Number.isInteger(score)
                ? score
                : 0;

        const resolvedWrongCount = Number.isInteger(wrongCount)
            ? wrongCount
            : Number.isInteger(total)
                ? Math.max(total - resolvedCorrectCount, 0)
                : 0;

        const resolvedWrongQuestions = Array.isArray(wrongQuestions)
            ? wrongQuestions
            : [];

        // Lấy score thực tế từ game (ví dụ: điểm Solo Adventure có multiplier), nếu không có thì fallback về số câu đúng
        const resolvedScore = score !== undefined ? Number(score) : resolvedCorrectCount;

        // Lưu vào bảng results
        // Mở rộng cấu trúc: lưu thêm material_id, correct_count, wrong_count, wrong_questions, time_taken
        const timeTaken = Number(req.body.time_taken) || 0;
        await sequelize.query(
            `INSERT INTO results
                (user_id, quiz_id, material_id, score, correct_count, wrong_count, wrong_questions, time_taken, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [
                    userId,
                    quizId || null,
                    materialId || null,
                    resolvedScore,
                    resolvedCorrectCount,
                    resolvedWrongCount,
                    JSON.stringify(resolvedWrongQuestions),
                    timeTaken
                ],
                type: QueryTypes.INSERT
            }
        );

        // Ghi log hành động hoàn thành Quiz
        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, quiz_id, action, progress) VALUES (?, ?, ?, ?, ?)',
            {
                replacements: [userId, materialId || null, quizId || null, 'COMPLETED_QUIZ', resolvedCorrectCount >= 3 ? 10 : 0],
                type: QueryTypes.INSERT
            }
        );

        // === BADGE CHECKER: Kiểm tra và cấp thẻ thành tích ===
        const newBadges = await badgeChecker.processQuizCompletion(userId, {
            correctCount: resolvedCorrectCount,
            totalQuestions: Number(total) || resolvedCorrectCount + resolvedWrongCount,
            timeTaken: timeTaken
        });

        res.status(201).json({
            status: 'success',
            message: "Đã lưu kết quả thi thành công!",
            newBadges: newBadges || []
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
        const { quizId, materialId, selectedAnswers } = req.body;
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

        // Lưu mọi lần làm quiz để đánh giá tiến độ nhất quán (đúng hoặc sai)
        const timeTaken = Number(req.body.time_taken) || 0;
        await sequelize.query(
            `INSERT INTO results
                (user_id, quiz_id, material_id, score, correct_count, wrong_count, wrong_questions, time_taken, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [
                    userId,
                    quizId || null,
                    materialId || null,
                    correctCount,
                    correctCount,
                    wrongAnswers.length,
                    JSON.stringify(wrongAnswers),
                    timeTaken
                ],
                type: QueryTypes.INSERT
            }
        );

        const retryRequired = wrongAnswers.length >= 3;

        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, quiz_id, action, progress) VALUES (?, ?, ?, ?, ?)',
            {
                replacements: [userId, materialId || null, quizId || null, 'COMPLETED_QUIZ', retryRequired ? 0 : 10],
                type: QueryTypes.INSERT
            }
        );

        // === BADGE CHECKER: Kiểm tra và cấp thẻ thành tích ===
        const totalQuestions = questions.length;
        const timeTaken2 = Number(req.body.time_taken) || 0;
        const newBadges = await badgeChecker.processQuizCompletion(userId, {
            correctCount,
            totalQuestions,
            timeTaken: timeTaken2
        });

        if (retryRequired) {
            return res.status(200).json({ retryRequired: true, wrongAnswers, score: correctCount, newBadges: newBadges || [] });
        }

        return res.status(200).json({ retryRequired: false, score: correctCount, newBadges: newBadges || [] });
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
        // Lấy top 10 người có tổng điểm cao nhất trong 7 ngày qua (Bảng xếp hạng tuần)
        const leaderboard = await sequelize.query(`
            SELECT 
                u.id as user_id,
                u.name, 
                COUNT(r.id) as quizzes_taken,
                SUM(r.score) as total_score,
                MAX(r.score) as high_score,
                SUM(r.time_taken) as total_time
            FROM results r
            JOIN users u ON r.user_id = u.id
            WHERE r.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY u.id
            ORDER BY total_score DESC, total_time ASC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        // Format data: gán rank
        const formattedLeaderboard = leaderboard.map((player, index) => ({
            ...player,
            rank: index + 1
        }));

        res.status(200).json({
            status: 'success',
            data: formattedLeaderboard
        });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Lỗi khi tải bảng xếp hạng" });
    }
};

/**
 * 6. Gợi ý học tập đơn giản theo luật (không dùng AI)
 */
exports.getRecommendation = async (req, res) => {
    try {
        const userId = req.user.id;

        const [latestResult] = await sequelize.query(
            `SELECT
                r.id,
                r.material_id,
                COALESCE(r.correct_count, ROUND(r.score), 0) AS correct_count,
                COALESCE(r.wrong_count, GREATEST(0, 5 - COALESCE(r.correct_count, ROUND(r.score), 0))) AS wrong_count,
                r.wrong_questions,
                COALESCE(r.created_at, r.submitted_at) AS attempt_at,
                m.title AS material_title
             FROM results r
             LEFT JOIN materials m ON m.id = r.material_id
             WHERE r.user_id = :userId
             ORDER BY COALESCE(r.created_at, r.submitted_at) DESC
             LIMIT 1`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        if (!latestResult) {
            return res.status(200).json({
                message: 'Chưa có dữ liệu quiz để đưa ra gợi ý.',
                suggestedLessons: []
            });
        }

        let wrongQuestions = [];
        if (Array.isArray(latestResult.wrong_questions)) {
            wrongQuestions = latestResult.wrong_questions;
        } else if (typeof latestResult.wrong_questions === 'string' && latestResult.wrong_questions.trim()) {
            try {
                wrongQuestions = JSON.parse(latestResult.wrong_questions);
            } catch {
                wrongQuestions = [];
            }
        }

        const wrongCount = Number(latestResult.wrong_count || 0);
        const hasWrongQuestions = wrongQuestions.length > 0;

        let message = 'Bạn đang làm rất tốt. Hãy tiếp tục bài học tiếp theo.';
        if (wrongCount >= 3) {
            message = 'Bạn nên ôn lại bài học một lần nữa.';
        } else if (hasWrongQuestions) {
            message = 'Bạn nên ôn lại các chủ đề đã trả lời sai.';
        }

        const focusTopics = [...new Set(
            wrongQuestions
                .map((item) => item?.contentReference)
                .filter((ref) => typeof ref === 'string' && ref.trim())
        )];

        const suggestedLessons = latestResult.material_id ? [
            {
                materialId: Number(latestResult.material_id),
                title: latestResult.material_title || null,
                focusTopics
            }
        ] : [];

        return res.status(200).json({
            message,
            suggestedLessons
        });
    } catch (error) {
        console.error('Recommendation Error:', error);
        return res.status(500).json({ message: 'Lỗi khi tạo gợi ý học tập', suggestedLessons: [] });
    }
};

/**
 * 5. Lấy lịch sử kết quả quiz của user hiện tại
 */
exports.getQuizHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const rows = await sequelize.query(
            `SELECT
                r.material_id AS materialId,
                m.title AS materialTitle,
                CAST(COALESCE(r.correct_count, r.score, 0) AS SIGNED) AS score,
                CAST(COALESCE(r.correct_count, r.score, 0) AS SIGNED) AS correctCount,
                CAST(COALESCE(r.wrong_count, GREATEST(0, 5 - COALESCE(r.correct_count, r.score, 0))) AS SIGNED) AS wrongCount,
                r.wrong_questions AS wrongQuestions,
                COALESCE(r.created_at, r.submitted_at) AS date,
                COALESCE(r.created_at, r.submitted_at) AS createdAt
             FROM results r
             LEFT JOIN materials m ON m.id = r.material_id
             WHERE r.user_id = :userId
             ORDER BY COALESCE(r.created_at, r.submitted_at) DESC`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Quiz History Error:', error);
        return res.status(500).json({ message: 'Lỗi khi tải lịch sử quiz' });
    }
};