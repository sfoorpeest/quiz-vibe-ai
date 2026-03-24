const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ApiLog = require('../models/ApiLog');
const aiService = require('../services/aiService');

exports.createAiQuiz = async (req, res) => {
    try {
        const { topic, limit } = req.body;
        const userId = req.user.id;

        // 1. GỌI AI THẬT: Lấy câu hỏi từ Gemini
        // Hàm này giờ sẽ trả về nội dung thật thay vì mảng mẫu
        const questionsFromAi = await aiService.generateQuizFromAI(topic, limit);

        // 2. Tạo Quiz mới trong Database
        const newQuiz = await Quiz.create({
            title: `Quiz về ${topic}`,
            subject: topic, // Thêm subject theo cấu trúc SQL của bạn
            created_by: userId
        });

        // 3. Lưu các câu hỏi vào bảng questions
        // Đảm bảo map đúng các cột: quiz_id, content, options, correct_answer
        const questionsToSave = questionsFromAi.map(q => ({
            quiz_id: newQuiz.id,
            content: q.question, // Nội dung câu hỏi từ AI
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