const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const badgeController = require('../controllers/badgeController');

// 1. Lấy danh sách tất cả thẻ thành tích + trạng thái của user
router.get('/', auth, badgeController.getAllBadges);

// 2. Lấy thống kê tích lũy của user (UserStats)
router.get('/user-stats', auth, badgeController.getUserStats);

// 3. Lấy thẻ mới nhận gần đây (cho notification)
router.get('/recent', auth, badgeController.getRecentBadges);

// 4. Trang bị 1 thẻ đại diện cho Bảng xếp hạng
router.post('/equip', auth, badgeController.equipBadge);

// 5. Ghim tối đa 3 thẻ lên Profile Header
router.post('/feature', auth, badgeController.featureBadges);

module.exports = router;
