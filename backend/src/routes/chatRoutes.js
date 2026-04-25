const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * Routes: Chat
 * 
 * Tất cả các API chat đều yêu cầu xác thực (JWT token).
 * authMiddleware được áp dụng cho toàn bộ router.
 * 
 * Danh sách endpoint:
 * GET  /api/chat/contacts        → Danh bạ (những người đã nhắn tin)
 * GET  /api/chat/search          → Tìm kiếm người dùng mới
 * GET  /api/chat/history/:userId → Lịch sử chat với một người
 * POST /api/chat/upload          → Upload file và gửi qua chat
 * POST /api/chat/forward         → Chuyển tiếp file sang người khác
 * PUT  /api/chat/seen/:senderId  → Đánh dấu đã xem tin nhắn
 */
router.use(authMiddleware);

// --- Danh bạ & Tìm kiếm ---
router.get('/contacts', chatController.getContacts);
router.get('/search', chatController.searchUsers);

// --- Lịch sử chat ---
router.get('/history/:userId', chatController.getChatHistory);

// --- Upload file ---
// upload.single('file'): multer xử lý 1 file duy nhất với field name là 'file'
// Multer sẽ validate loại file và kích thước trước khi đến controller
router.post('/upload', upload.single('file'), chatController.uploadFile);

// --- Chuyển tiếp tin nhắn ---
router.post('/forward', chatController.forwardMessage);

// --- Đánh dấu đã xem ---
router.put('/seen/:senderId', chatController.markMessagesAsSeen);

module.exports = router;
