const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

// Đăng ký: Validator -> Controller
router.post('/register', registerValidator, authController.register);

// Đăng nhập: Validator -> Controller
router.post('/login', loginValidator, authController.login);

// Đổi mật khẩu: Cần Token xác thực
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;