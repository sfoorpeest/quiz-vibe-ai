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
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mime)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ định dạng ảnh JPG, PNG, GIF, WebP.'));
        }
    }
});

// --- Routes ---
// Tất cả đều cần đăng nhập (authMiddleware)
router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);

// Route upload avatar với xử lý lỗi Multer
router.post('/avatar', authMiddleware, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Ảnh quá lớn (Tối đa 5MB). Vui lòng nén ảnh hoặc chọn ảnh khác." });
            }
            return res.status(400).json({ message: `Lỗi tải ảnh: ${err.message}` });
        } else if (err) {
            // Lỗi từ fileFilter hoặc lỗi khác
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, profileController.uploadAvatar);
router.get('/activity', authMiddleware, profileController.getActivity);
router.get('/summary', authMiddleware, profileController.getDashboardSummary);

module.exports = router;
