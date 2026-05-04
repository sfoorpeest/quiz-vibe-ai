const express = require('express');
const router = express.Router();
const { onlineUsers } = require('../socket/socket');

/**
 * GET /api/stats/online-count
 * Trả về số lượng người dùng đang kết nối (online) thực tế từ Socket.IO
 */
router.get('/online-count', (req, res) => {
    try {
        const count = onlineUsers.size;
        
        // Thêm một số lượng "ảo" nhỏ nếu muốn trông sôi động hơn (tùy chọn)
        // Nhưng ở đây user yêu cầu "thông tin đúng" nên tôi sẽ trả về đúng size.
        // Tuy nhiên, để tránh con số 0 hoặc 1 trông quá vắng vẻ, 
        // ta có thể cộng thêm một lượng base nhỏ (VD: + 5) nếu hệ thống mới triển khai.
        // Nhưng tôi sẽ tuân thủ "thông tin đúng".
        
        res.json({
            status: 'success',
            count: count
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
