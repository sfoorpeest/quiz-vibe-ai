const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Cấu hình Multer cho Upload Avatar ---
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP.'));
        }
    }
});

// --- Routes ---
// Tất cả đều cần đăng nhập (authMiddleware)
router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);
router.post('/avatar', authMiddleware, upload.single('avatar'), profileController.uploadAvatar);
router.get('/activity', authMiddleware, profileController.getActivity);
router.get('/summary', authMiddleware, profileController.getDashboardSummary);

module.exports = router;
