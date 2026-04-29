const express = require('express');
const router = express.Router();
const multer = require('multer');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Cấu hình Multer cho Upload Avatar ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const path = require('path');
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
                return res.status(400).json({ success: false, message: 'Ảnh quá lớn (Tối đa 5MB). Vui lòng nén ảnh hoặc chọn ảnh khác.', error: err.code });
            }
            return res.status(400).json({ success: false, message: `Lỗi tải ảnh: ${err.message}`, error: err.code || err.message });
        } else if (err) {
            // Lỗi từ fileFilter hoặc lỗi khác
            return res.status(400).json({ success: false, message: err.message, error: err.message });
        }
        next();
    });
}, profileController.uploadAvatar);
router.get('/activity', authMiddleware, profileController.getActivity);
router.get('/summary', authMiddleware, profileController.getDashboardSummary);
router.post('/items/save', authMiddleware, profileController.saveItem);
router.delete('/items/save', authMiddleware, profileController.unsaveItem);
router.post('/items/favorite', authMiddleware, profileController.favoriteItem);
router.delete('/items/favorite', authMiddleware, profileController.unfavoriteItem);
router.get('/items/saved', authMiddleware, profileController.getSavedItems);
router.get('/items/favorites', authMiddleware, profileController.getFavoriteItems);
router.post('/items/states', authMiddleware, profileController.getItemStates);

module.exports = router;
