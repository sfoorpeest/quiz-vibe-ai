const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
<<<<<<< HEAD
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, authController.changePassword);
=======
// Import bộ kiểm soát dữ liệu đầu vào
const { registerValidator, loginValidator } = require('../validators/authValidator');

// Đăng ký: Validator -> Controller
router.post('/register', registerValidator, authController.register);

// Đăng nhập: Validator -> Controller
router.post('/login', loginValidator, authController.login);
>>>>>>> main

module.exports = router;