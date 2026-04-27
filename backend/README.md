# QuizVibe AI - Backend System 🚀

Hệ thống Backend được xây dựng bằng **Node.js**, **Express** và **Sequelize (MySQL)**, tích hợp trí tuệ nhân tạo **Google Gemini API** để hỗ trợ giáo dục thông minh.

## 🛠️ Hướng dẫn thiết lập nhanh (Quick Start)

### 1. Cơ sở dữ liệu (MySQL)
- Schema v1.1: Đã bao gồm các bảng phục vụ AI, Theo dõi tiến độ, Lớp học và Phiếu học tập.
- **Thực hiện**: Chạy file SQL tại `backend/src/database/sql/education_quiz_db.sql`.
- **Các bảng quan trọng**:
    - `materials`: Lưu trữ bài giảng (có cột content để AI phân tích).
    - `groups`: Quản lý lớp học của giáo viên.
    - `worksheets`: Phiếu học tập tự luận sinh bằng AI.
    - `learning_history`: Lưu tiến độ học tập của Student.

### 2. Cấu hình Backend (Node.js)
```bash
cd backend
npm install
```
- Tạo file `.env` và điền các thông số: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `GEMINI_API_KEY`, `JWT_SECRET`.
- Chạy Server: `npm run dev` (Sử dụng Nodemon).

## 💡 Các tính năng AI cốt lõi
1. **Gemini OCR & Extract**: Tự động đọc file PDF/Docx/Link để sinh bài giảng Markdown.
2. **AI Worksheet Generator**: Tự động tạo 5 câu hỏi tự luận đào sâu từ nội dung bài học.
3. **Gia sư ảo (Virtual Tutor)**: Chat trực tiếp với AI dựa trên ngữ cảnh của từng học liệu.
4. **Smart Tagging**: Tự động gán nhãn chủ đề dựa trên nội dung văn bản.

## 📁 Cấu trúc thư mục chính
- `/src/controllers`: Xử lý logic API (Auth, Edu, Chat, Quiz).
- `/src/services`: Tầng xử lý nghiệp vụ (AI, File Parser, Material logic).
- `/src/routes`: Định nghĩa các endpoint API.
- `/src/database/migrations`: Các bản cập nhật cấu trúc DB.

## Nhật ký phát triển (Diary)

### 28/04 - Bản Cập Nhật Lớn: Hệ Sinh Thái Quản Lý Lớp Học & Phiếu Học Tập AI

**1. Cơ sở dữ liệu (Migrations & Database)**
- **Migration 18 (`20260427000018-add-visibility-and-groups.js`)**: 
  - Bổ sung cột `visibility` (`private`, `shared`, `public`) vào bảng `materials` để thiết lập quyền riêng tư cho học liệu.
  - Tạo mới các bảng cốt lõi cho Quản lý lớp: `groups` (Lớp học), `group_members` (Học sinh trong lớp), `group_materials` (Bài tập giao cho lớp).
- **Migration 19 (`20260427000019-create-worksheets.js`)**:
  - Tạo bảng `worksheets` lưu trữ các phiếu học tập tự luận được sinh ra từ Gemini AI.
  - Tạo bảng `worksheet_submissions` lưu trữ bài làm của học sinh.

**2. Backend (API & Controllers)**
- **`eduController.js`**: Viết mới và tối ưu 13+ endpoints cốt lõi.
  - *Quản lý Lớp (Groups)*: `createGroup`, `getTeacherGroups`, `getGroupDetails`, `addGroupMembers`, `assignMaterialToGroup`. Xử lý truy vấn SQL phức tạp kết hợp `LEFT JOIN user_profiles` để lấy ảnh đại diện chính xác.
  - *Phiếu học tập (Worksheets)*: `generateWorksheetWithAI` (Prompt chuyên sâu để gọi Gemini sinh JSON câu hỏi tự luận), `getAllWorksheetsForTeacher`, `getWorksheetsForStudent`, `getWorksheetById`.
- **`eduRoutes.js`**: Chuẩn hóa toàn bộ prefix router dưới `/api/edu/...`.

**3. Frontend (Giao diện & Tích hợp)**
- **Thư viện mới**: Cài đặt và cấu hình `react-hot-toast` trên toàn cục (`App.jsx`) để hiển thị thông báo mượt mà.
- **Service (`eduService.js`)**: Gom nhóm toàn bộ 12 API calls liên quan đến Giáo dục, giúp frontend dễ dàng bảo trì.
- **Upload Center (`UploadCenter.jsx`)**: Thêm tùy chọn "Công khai" / "Riêng tư" ở màn hình tải tài liệu.
- **Quản lý Lớp Học (`TeacherGroupManagement.jsx`)**: Tích hợp hoàn chỉnh API. Giáo viên có thể xem học sinh tự do, tạo nhóm, và phân bổ học sinh.
- **Học Liệu & AI (`LearningView.jsx`)**: Thêm chức năng "PHIẾU AI" cho phép Giáo viên dùng AI sinh ngay bộ câu hỏi tự luận từ nội dung văn bản gốc.
- **Quản lý Phiếu Học Tập (`WorksheetBuilder.jsx` & `WorksheetPublic.jsx`)**: Giáo viên có thể xem lại, in ấn phiếu và giao cho các nhóm. Giao diện chia sẻ liên kết công khai cũng đã hoạt động trơn tru lấy dữ liệu thật.
- **Góc Học Tập Học Sinh (`MyLessons.jsx`)**: Thêm Tab "Phiếu Học Tập", tự động hiển thị các bài tập mà Giáo viên đã phân công cho Nhóm của học sinh đó.

**4. Các Vấn đề đã Khắc phục (Bug Fixes & Refinements)**
- **API `removeGroupMember`**: Đã bổ sung logic `DELETE /groups/:id/members/:studentId` ở backend (`eduRoutes.js`, `eduController.js`) và tích hợp vào frontend, cho phép xóa học sinh khỏi nhóm. Cập nhật giao diện tự động loại bỏ khỏi danh sách ngay lập tức.
- **Thanh Tiến Độ Sĩ Số Lớp**: Chuyển đổi hiển thị từ `% hoàn thành` (mock data) thành `"Sĩ số: X / 50"` cho phù hợp với logic của quản lý Lớp học thực tế.
- **Lỗi 400 Validation (Title & Visibility)**: 
  - Đã thêm kiểm tra Validation trên Frontend (`UploadCenter.jsx`) để báo lỗi thân thiện nếu Tên bài giảng dưới 5 ký tự (Do AI lấy lỗi hoặc người dùng quên nhập).
  - Cập nhật `Joi Validator` ở Backend (`eduValidator.js`) để cho phép chấp nhận giá trị của thuộc tính `visibility`.
- **Lọc quyền riêng tư (Privacy Filter)**: Đã sửa lại câu lệnh SQL trong `getAllMaterials` và `searchMaterials` để các tài liệu `private` chỉ được hiển thị cho chính người tạo ra nó (`created_by = req.user.id`).