Education Quiz AI (Vibe Coding)
Dự án thực tập tại Kyanon Digital > Hệ thống quản lý học tập và tạo câu hỏi trắc nghiệm thông minh tích hợp Google Gemini AI.

📁 Cấu trúc dự án
backend/: Node.js API (Layered Architecture: Controller - Middleware - Service - Model/Sequelize).

frontend/: React.js (Vite + Tailwind CSS).

🛠️ Hướng dẫn thiết lập nhanh (Quick Start)
1. Cơ sở dữ liệu (MySQL)
Schema v1.1 (Final Review): Đã bao gồm các bảng mở rộng phục vụ AI và Theo dõi tiến độ.

Thực hiện: Chạy file SQL tại backend/src/database/sql/education_quiz_db.sql.

Các bảng quan trọng:

materials: Lưu trữ bài giảng (có cột content để AI phân tích).

learning_history: Lưu tiến độ học tập của Student.

quizzes & questions: Hệ thống câu hỏi trắc nghiệm.

2. Cấu hình Backend (Node.js)
Bash
cd backend
npm install
# Tạo file .env và điền các thông số sau:
# DB_HOST, DB_USER, DB_PASS, DB_NAME
# GEMINI_API_KEY (Lấy từ Google AI Studio)
# JWT_SECRET (Để mã hóa Token)
npm start
🔌 API Documentation (Hệ thống Edu)
Base URL: http://localhost:5000/api/edu

Auth: Header Authorization: Bearer <token> (Bắt buộc).

👨‍🏫 1. Role: Teacher (ID: 2) & Admin (ID: 3)
Tạo học liệu: POST /materials

Body: { title, description, content, content_url }

Trợ lý AI (Gemini): POST /materials/:id/ai-process

Mô tả: Tự động tóm tắt bài giảng thành 5 gạch đầu dòng và trích xuất từ khóa.

🎓 2. Role: Student (ID: 1)
Xem danh sách học liệu: GET /materials

Mô tả: Lấy toàn bộ bài giảng từ Database (Dữ liệu tồn tại vĩnh viễn sau khi Teacher tạo).

Ghi nhận tiến độ: POST /learning/track

Body: { material_id, action: "VIEWED_MATERIAL", progress: 100 }

Action hợp lệ: VIEWED_MATERIAL, STARTED_QUIZ, COMPLETED_QUIZ.

🛡️ 3. Role: Admin (ID: 3)
Dashboard Stats: GET /admin/stats

Mô tả: Trả về tổng số học liệu, lượt học và số lượng User theo Role.

Quản trị nội dung: DELETE /admin/materials/:id

Mô tả: Xóa vĩnh viễn bài giảng khỏi hệ thống.