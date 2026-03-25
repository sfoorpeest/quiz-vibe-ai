const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// ── Tất cả routes đều yêu cầu đăng nhập + role Admin (3) ──

// Tổng quan dashboard
router.get('/stats',    auth, checkRole([3]), adminController.getDashboardStats);

// Danh sách người dùng
router.get('/users',    auth, checkRole([3]), adminController.getAllUsers);
router.delete('/users/:id', auth, checkRole([3]), adminController.deleteUser);

// Top quiz và thống kê chủ đề
router.get('/top-quizzes',   auth, checkRole([3]), adminController.getTopQuizzes);
router.get('/subject-stats', auth, checkRole([3]), adminController.getSubjectStats);

// Hoạt động gần đây
router.get('/activity', auth, checkRole([3]), adminController.getRecentActivity);

module.exports = router;
