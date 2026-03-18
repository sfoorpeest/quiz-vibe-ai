const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ApiLog = require('../models/ApiLog');
const aiService = require('../services/aiService');

exports.createAiQuiz = async (req, res) => {
    try {
        const { topic, limit } = req.body;
        const userId = req.user.id; 

        // Tạm thời dùng dữ liệu giả
        const questionsFromAi = [
            { 
                question: `Câu hỏi mẫu về ${topic} 1`, 
                options: ["A", "B", "C", "D"], 
                correct_answer: "A" 
            },
            { 
                question: `Câu hỏi mẫu về ${topic} 2`, 
                options: ["E", "F", "G", "H"], 
                correct_answer: "F" 
            }
        ];

        // 1. Tạo Quiz mới - Đổi user_id thành created_by cho khớp SQL
        const newQuiz = await Quiz.create({
            title: `Quiz về ${topic}`,
            subject: topic, // Thêm subject theo cấu trúc SQL của bạn
            created_by: userId 
        });

        // 2. Lưu câu hỏi - Khớp với các cột: quiz_id, content, options, correct_answer
        const questionsToSave = questionsFromAi.map(q => ({
            quiz_id: newQuiz.id,
            content: q.question, // Đổi từ question thành content
            options: q.options,
            correct_answer: q.correct_answer
        }));

        await Question.bulkCreate(questionsToSave);

        // 3. TỰ ĐỘNG GHI LOG (Phần mới)
        await ApiLog.create({
            user_id: userId,
            api_name: 'CREATE_QUIZ_AI',
            request_payload: JSON.stringify(req.body),
            response_text: `Thành công: Tạo Quiz ID ${newQuiz.id}`
        });

        res.status(201).json({
            message: "Đã tạo và lưu Quiz thành công vào Database!",
            quizId: newQuiz.id,
            totalQuestions: questionsToSave.length
        });
    } catch (error) {
        // Ghi log lỗi nếu thất bại
        if (req.user) {
            await ApiLog.create({
                user_id: req.user.id,
                api_name: 'CREATE_QUIZ_AI_ERROR',
                response_text: error.message
            });
        }
        res.status(500).json({ error: error.message });
    }
};