const Joi = require('joi');

/**
 * Validator cho luồng Đăng ký (Register)
 * Đảm bảo: Tên đủ dài, Email đúng định dạng, Mật khẩu an toàn.
 */
const registerValidator = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required()
            .messages({ 'string.min': 'Tên người dùng phải có ít nhất 3 ký tự' }),
        
        email: Joi.string().email().required()
            .messages({ 'string.email': 'Địa chỉ email không hợp lệ' }),
        
        password: Joi.string().min(6).required()
            .messages({ 'string.min': 'Mật khẩu phải bảo mật hơn (tối thiểu 6 ký tự)' }),
        
        // secretCode dùng để phân quyền Admin/Teacher, có thể để trống
        secretCode: Joi.string().allow('', null)
    });

    // Thực hiện kiểm tra dữ liệu từ body của request
    const { error } = schema.validate(req.body);

    // Nếu có lỗi, dừng luồng xử lý và trả về mã 400 (Bad Request)
    if (error) {
        return res.status(400).json({ 
            status: 'error',
            message: error.details[0].message 
        });
    }
    
    // Dữ liệu hợp lệ, cho phép đi tiếp vào Controller
    next();
};

/**
 * Validator cho luồng Đăng nhập (Login)
 */
const loginValidator = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            status: 'error',
            message: 'Vui lòng cung cấp đầy đủ Email và Mật khẩu' 
        });
    }
    next();
};

module.exports = { registerValidator, loginValidator };