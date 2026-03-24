const Joi = require('joi');

// Kiểm tra dữ liệu khi thêm học liệu
const materialValidator = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(5).max(255).required(),
        description: Joi.string().min(10).required(), // Thêm để tránh lỗi "not allowed"
        content: Joi.string().min(20).required(),     // Nội dung chi tiết cho AI
        content_url: Joi.string().uri().allow('', null), // Thêm để nhận link tài liệu
        type: Joi.string().valid('DOCUMENT', 'VIDEO', 'LINK').default('DOCUMENT')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

// Kiểm tra dữ liệu khi lưu lịch sử học tập (Giữ nguyên hoặc thêm quiz_id nếu cần)
const historyValidator = (req, res, next) => {
    const schema = Joi.object({
        material_id: Joi.number().optional().allow(null), // Cho phép null nếu chỉ làm Quiz
        quiz_id: Joi.number().optional().allow(null),     // Thêm để lưu kết quả Quiz
        action: Joi.string().valid('VIEWED_MATERIAL', 'STARTED_QUIZ', 'COMPLETED_QUIZ').required(),
        progress: Joi.number().min(0).max(100).required() 
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

module.exports = { materialValidator, historyValidator };