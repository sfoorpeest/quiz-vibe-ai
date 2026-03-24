const Joi = require('joi');

/**
 * Validator cho luồng tạo Quiz bằng AI
 * Giúp tránh việc gửi yêu cầu quá lớn làm treo API AI hoặc tràn bộ nhớ DB.
 */
const createQuizValidator = (req, res, next) => {
    const schema = Joi.object({
        // Chủ đề bài Quiz
        topic: Joi.string().min(2).max(200).required()
            .messages({ 'any.required': 'Bạn chưa nhập chủ đề cho bài Quiz' }),
        
        // Giới hạn số câu hỏi (Tránh spam API AI)
        limit: Joi.number().integer().min(1).max(20).default(5)
            .messages({
                'number.max': 'Hệ thống chỉ hỗ trợ tạo tối đa 20 câu hỏi một lúc',
                'number.min': 'Số lượng câu hỏi tối thiểu là 1'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            status: 'error',
            message: error.details[0].message 
        });
    }
    next();
};

module.exports = { createQuizValidator };