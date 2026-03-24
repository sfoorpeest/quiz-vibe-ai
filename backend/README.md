# Education Quiz AI (Vibe Coding)
<<<<<<< HEAD

Dự án thực tập tại Kyanon Digital.

## Cấu trúc dự án

- `backend/`: Node.js API (Layered Architecture)
- `frontend/`: React.js (Vite)

## Hướng dẫn thiết lập

1. Cài đặt Database:
   - Chạy file SQL trong `backend/src/database/sql/DeepSeek_Api_DB.sql`.
   - Hoặc nếu đã có database, đảm bảo bảng `roles` có ít nhất một bản ghi (ví dụ `id=1`) để user có thể đăng ký.
2. Backend: `cd backend && npm install && npm start`
3. Frontend: `cd frontend && npm install && npm run dev`
=======
Dự án thực tập tại Kyanon Digital - Hệ thống tạo câu hỏi trắc nghiệm thông minh tích hợp Gemini AI.

## 📁 Cấu trúc dự án
- `backend/`: Node.js API (Layered Architecture: Controller - Service - Repository/Model)
- `frontend/`: React.js (Vite)

## 🛠️ Hướng dẫn thiết lập nhanh (Quick Start)

### 1. Cơ sở dữ liệu (MySQL)
* **Quan trọng:** Đã cập nhật lên Schema v1.1 (Final Review by SE).
* **Thực hiện:** Chạy file SQL tại `backend/src/database/sql/education_quiz_db.sql`.
* **Lưu ý:** File mới đã bao gồm các bảng mở rộng (`materials`, `tags`, `learning_history`) và các ràng buộc dữ liệu (Constraints).

### 2. Backend (Node.js)
```bash
cd backend
npm install
# Tạo file .env và cấu hình DB_HOST, DB_USER, DB_PASS, GEMINI_API_KEY
npm start

### 3. Frontend (React)
cd frontend
npm install
npm run dev
>>>>>>> main
