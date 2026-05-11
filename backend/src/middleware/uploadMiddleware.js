const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Middleware: uploadMiddleware
 * 
 * Cấu hình multer để xử lý upload file trong chat.
 * 
 * Quy tắc upload:
 * - Chỉ chấp nhận 3 loại file: PDF, DOCX, TXT
 * - Giới hạn kích thước: 10MB/file
 * - File lưu vào thư mục: backend/uploads/chat-files/
 * - Tên file được đổi thành: timestamp-originalname để tránh trùng lặp
 */

// --- 1. Cấu hình Storage (Sử dụng MemoryStorage để upload trực tiếp lên Cloud) ---
const storage = multer.memoryStorage();

// --- 2. Bộ lọc file (chỉ cho phép PDF, DOCX, TXT) ---
const fileFilter = (req, file, cb) => {
    // Danh sách MIME types được chấp nhận
    const ALLOWED_MIME_TYPES = [
        'application/pdf',                                                         // PDF
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword',                                                      // DOC (cũ)
        'text/plain'                                                               // TXT
    ];

    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true); // Chấp nhận file
    } else {
        // Từ chối file không hợp lệ với thông báo lỗi rõ ràng
        cb(new Error('Chỉ được phép upload file PDF, DOCX, hoặc TXT'), false);
    }
};

// --- 3. Tạo instance multer với đầy đủ cấu hình ---
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB tính bằng bytes
    }
});

module.exports = upload;

