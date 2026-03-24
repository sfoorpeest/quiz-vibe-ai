const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Import bộ kiểm soát dữ liệu đầu vào
const { registerValidator, loginValidator } = require('../validators/authValidator');

// Đăng ký: Validator -> Controller
router.post('/register', registerValidator, authController.register);

// Đăng nhập: Validator -> Controller
router.post('/login', loginValidator, authController.login);

module.exports = router;