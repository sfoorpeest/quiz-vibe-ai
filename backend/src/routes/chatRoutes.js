const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Workflow: Tất cả các API liên quan đến chat đều cần đăng nhập (có token)
// nên chúng ta sử dụng authMiddleware cho toàn bộ router này.
router.use(authMiddleware);

// Route: GET /api/chat/contacts
// Mục đích: Lấy danh sách những người dùng đã từng nhắn tin.
router.get('/contacts', chatController.getContacts);

// Route: GET /api/chat/search
// Mục đích: Tìm kiếm người dùng để nhắn tin mới.
router.get('/search', chatController.searchUsers);

// Route: GET /api/chat/history/:userId
// Mục đích: Lấy lịch sử nhắn tin giữa người dùng hiện tại và user có id là :userId.
router.get('/history/:userId', chatController.getChatHistory);

module.exports = router;
