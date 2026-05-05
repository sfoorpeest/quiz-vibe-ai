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
            success: true,
            message: "Đã tạo và lưu Quiz thành công với dữ liệu AI thật!",
            data: {
                quizId: newQuiz.id,
                totalQuestions: questionsToSave.length,
                data: questionsToSave // Trả về để FE có thể hiển thị ngay
            },
            errorCode: null
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
        res.status(500).json({ success: false, message: "Lỗi khi tạo quiz AI", data: null, errorCode: "CREATE_AI_QUIZ_FAILED" });
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
            success: true,
            message: "Đã tạo câu hỏi ngẫu nhiên thành công!",
            data: questionsToReturn,
            errorCode: null
        });
    } catch (error) {
        console.error("Random Quiz Controller Error:", error.message);
        res.status(500).json({ success: false, message: "Lỗi khi sinh câu hỏi ngẫu nhiên.", data: null, errorCode: "GENERATE_RANDOM_QUIZ_FAILED" });
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
            wrongQuestions,
            gameMode
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
        const effectiveGameMode = gameMode || 'PRACTICE';

        await sequelize.query(
            `INSERT INTO results
                (user_id, quiz_id, material_id, score, correct_count, wrong_count, wrong_questions, time_taken, game_mode, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [
                    userId,
                    quizId || null,
                    materialId || null,
                    resolvedScore,
                    resolvedCorrectCount,
                    resolvedWrongCount,
                    JSON.stringify(resolvedWrongQuestions),
                    timeTaken,
                    effectiveGameMode
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
        }, gameMode);

        res.status(201).json({
            success: true,
            message: "Đã lưu kết quả thi thành công!",
            data: { newBadges: newBadges || [] },
            errorCode: null
        });
    } catch (error) {
        console.error("Save Result Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lưu kết quả thi", data: null, errorCode: "SAVE_QUIZ_RESULT_FAILED" });
    }
};

/**
 * 3. Kiểm tra đáp án - quyết định cần ôn lại hay không
 */
exports.checkAnswers = async (req, res) => {
    try {
        const { quizId, materialId, selectedAnswers, gameMode } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
            return res.status(400).json({ success: false, message: 'selectedAnswers là bắt buộc', data: null, errorCode: 'SELECTED_ANSWERS_REQUIRED' });
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
        const effectiveGameMode = gameMode || 'PRACTICE';

        await sequelize.query(
            `INSERT INTO results
                (user_id, quiz_id, material_id, score, correct_count, wrong_count, wrong_questions, time_taken, game_mode, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [
                    userId,
                    quizId || null,
                    materialId || null,
                    correctCount,
                    correctCount,
                    wrongAnswers.length,
                    JSON.stringify(wrongAnswers),
                    timeTaken,
                    effectiveGameMode
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
        }, gameMode);

        if (retryRequired) {
            return res.status(200).json({
                success: true,
                message: 'Kiểm tra đáp án thành công',
                data: { retryRequired: true, wrongAnswers, score: correctCount, newBadges: newBadges || [] },
                errorCode: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Kiểm tra đáp án thành công',
            data: { retryRequired: false, score: correctCount, newBadges: newBadges || [] },
            errorCode: null
        });
    } catch (error) {
        console.error('Check Answers Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra đáp án', data: null, errorCode: 'CHECK_ANSWERS_FAILED' });
    }
};

/**
 * 4. Lấy bảng xếp hạng (Leaderboard) - Logic Edu Game
 * Thứ tự ưu tiên:
 * 1. Điểm cao nhất (Best Score) - DESC
 * 2. Số lần làm bài (Attempts) - ASC
 * 3. Thời gian hoàn thành (Time) - ASC
 * 4. Thời điểm đạt được (Timestamp) - ASC
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const { quizId, materialId, limit = 10, mode } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const replacements = [];

        if (quizId) {
            whereClause += ' AND r.quiz_id = ?';
            replacements.push(quizId);
        }
        if (materialId) {
            whereClause += ' AND r.material_id = ?';
            replacements.push(materialId);
        }
        
        // Nếu không có filter cụ thể, mặc định lấy các mode game để hiển thị Arena
        if (!quizId && !materialId) {
            whereClause += " AND r.game_mode IN ('SOLO', 'LIVE')";
        } else if (mode) {
            whereClause += " AND r.game_mode = ?";
            replacements.push(mode);
        }

        const currentUserId = req.user.id;

        const query = `
            WITH UserStats AS (
                SELECT 
                    u.id as user_id,
                    u.name, 
                    MAX(up.avatar_url) as avatar_url,
                    MAX(up.updated_at) as avatar_updated_at,
                    MAX(up.equipped_badge_id) as equipped_badge_id,
                    MAX(up.featured_badges) as featured_badges,
                    MAX(r.score) as high_score,
                    COUNT(r.id) as attempts,
                    MIN(NULLIF(r.time_taken, 0)) as best_time,
                    MIN(r.created_at) as achieved_at
                FROM results r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                ${whereClause}
                GROUP BY u.id
            ),
            RankedStats AS (
                SELECT 
                    US.*,
                    b_eq.tier as equipped_badge_tier,
                    b_eq.icon_url as equipped_badge_icon,
                    b_eq.name as equipped_badge_name,
                    (
                        SELECT b_f.tier 
                        FROM badges b_f 
                        WHERE US.featured_badges IS NOT NULL 
                          AND JSON_CONTAINS(US.featured_badges, CAST(b_f.id AS JSON))
                        ORDER BY FIELD(b_f.tier, 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND') DESC 
                        LIMIT 1
                    ) as highest_featured_tier,
                    RANK() OVER (ORDER BY US.high_score DESC, US.attempts ASC, US.best_time ASC, US.achieved_at ASC) as \`rank\`
                FROM UserStats US
                LEFT JOIN badges b_eq ON b_eq.id = US.equipped_badge_id
            )
            SELECT * FROM RankedStats
            WHERE \`rank\` <= ? OR user_id = ?
            ORDER BY \`rank\` ASC
        `;

        const leaderboardResults = await sequelize.query(query, { 
            replacements: [...replacements, parseInt(limit), currentUserId],
            type: QueryTypes.SELECT 
        });

        // Tách top list và user info
        const topList = leaderboardResults.filter(p => p.rank <= parseInt(limit));
        const currentUserStats = leaderboardResults.find(p => p.user_id === currentUserId);

        const formattedTopList = topList.map(player => ({
            ...player,
            high_score: parseFloat(player.high_score || 0),
            attempts: parseInt(player.attempts || 0),
            best_time: parseInt(player.best_time || 0)
        }));

        res.status(200).json({
            success: true,
            message: 'Lấy bảng xếp hạng thành công',
            data: {
                leaderboard: formattedTopList,
                currentUser: currentUserStats ? {
                    ...currentUserStats,
                    high_score: parseFloat(currentUserStats.high_score || 0),
                    attempts: parseInt(currentUserStats.attempts || 0),
                    best_time: parseInt(currentUserStats.best_time || 0)
                } : null
            },
            errorCode: null
        });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi tải bảng xếp hạng", data: null, errorCode: "GET_LEADERBOARD_FAILED" });
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
                success: true,
                message: 'Chưa có dữ liệu quiz để đưa ra gợi ý.',
                data: { suggestedLessons: [] },
                errorCode: null
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
            success: true,
            message,
            data: { suggestedLessons },
            errorCode: null
        });
    } catch (error) {
        console.error('Recommendation Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo gợi ý học tập', data: { suggestedLessons: [] }, errorCode: 'GET_RECOMMENDATION_FAILED' });
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

        return res.status(200).json({ success: true, message: 'Lấy lịch sử quiz thành công', data: rows, errorCode: null });
    } catch (error) {
        console.error('Quiz History Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi tải lịch sử quiz', data: null, errorCode: 'GET_QUIZ_HISTORY_FAILED' });
    }
};