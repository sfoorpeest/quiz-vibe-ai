const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

// Đăng ký: Validator -> Controller
router.post('/register', registerValidator, authController.register);

// Đăng nhập: Validator -> Controller
router.post('/login', loginValidator, authController.login);

// Lấy thông tin user hiện tại
router.get('/me', authMiddleware, authController.getMe);

// Cập nhật profile
router.put('/update-profile', authMiddleware, authController.updateProfile);

// Đổi mật khẩu: Cần Token xác thực
router.post('/change-password', authMiddleware, authController.changePassword);

// Quên mật khẩu: Nhận email và gửi link
router.post('/forgot-password', authController.forgotPassword);

// Đặt lại mật khẩu: Nhận token và mật khẩu mới từ link email
router.post('/reset-password', authController.resetPassword);

module.exports = router;