# QuizVibe AI - Frontend 🚀

Đây là hệ thống giao diện (Frontend) của nền tảng **QuizVibe AI** - Nền tảng phân tích học liệu và tạo câu hỏi tự động. Tài liệu này được biên soạn dành cho các Tester, Dev mới hoặc người đánh giá dự án để có thể làm quen, cài đặt và kiểm thử ứng dụng một cách nhanh chóng nhất.

## 🛠 Lộ trình Công nghệ (Tech Stack)
Dự án được xây dựng bằng thiết kế High-Fidelity (mô phỏng sản phẩm thực tế của doanh nghiệp) với các công nghệ mạnh mẽ nhất:
- **Framework:** React 19 + Vite 8
- **Routing:** React Router v7
- **Styling & UI:** Tailwind CSS v4, Framer Motion (Hiệu ứng siêu mượt)
- **Icons:** Lucide React
- **Kế nối HTTP:** Axios (Fetch dữ liệu siêu tốc)

---

## 📂 Kiến trúc Thư mục (Folder Structure)
Mã nguồn được đặt trong thư mục `src/`, bao gồm các phân khu chính sau:

```
src/
├── api/             # Cấu hình Axios Client chặn các request/response chung (Kèm Token).
├── components/      # Các linh kiện tái sử dụng: ProtectedRoute, Background động, Navigation,...
├── context/         # AuthContext: Quản lý trạng thái đăng nhập toàn cục của user.
├── pages/           # Giao diện của tất cả các luồng hoạt động chính (Xem chi tiết bên dưới).
├── services/        # Tập hợp các hàm gọi Backend API (authService,...).
├── App.jsx          # Cây điều hướng tổng (Router) quản lý toàn bộ các đường dẫn web.
└── main.jsx         # Điểm khởi chạy của React App.
```

### 🧩 Các Trang (Pages) Chính
1. **Public (Bất cứ ai cũng có thể vào):**
   - Xương sống trang chủ: `Home.jsx`
   - Đăng nhập & Đăng ký: `Login.jsx`, `Register.jsx`
   - Khôi phục tài khoản: `ForgotPassword.jsx`, `ResetPassword.jsx`
2. **Private (Cần Đăng Nhập):**
   - Đổi mật khẩu chủ động: `ChangePassword.jsx`
   - Dashboard Admin / Giáo viên: `AdminDashboard.jsx`, `UploadCenter.jsx` (Dành cho việc upload text/pdf/docx cho AI đọc).
   - Dành cho Học viên: `LearningView.jsx`, `QuizPage.jsx` (Làm trắc nghiệm do AI sinh), `ResultPage.jsx` (Phân tích kết quả).

---

## ⚙️ Hướng dẫn Cài Đặt (Cho Developer & Tester)

Để khởi chạy App trên máy tính của bạn, hãy chắc chắn phân hệ Backend đã được khởi động (thường là tại Cổng 5000), sau đó dọn dẹp các đường dẫn chạy lệnh ở Terminal như sau:

**Bước 1: Chuyển hướng Terminal vào khu vực Frontend**
```bash
cd frontend
```

**Bước 2: Cài đặt toàn bộ thư viện cơ sở**
*(Lệnh này tự động đọc file package.json và tải xuống react, axios, tailwind, lucide-react...)*
```bash
npm install
```

**Bước 3: Khởi chạy Máy chủ Thử nghiệm (Vite Dev Server)**
```bash
npm run dev
```
> Trình duyệt sẽ in ra một đường dẫn (thông thường là `http://localhost:5173`). Bạn bấm vào đó (hoặc bôi đen dán lên Chrome) để chiêm ngưỡng sản phẩm.

---

## 🧪 Tài liệu Hướng Dẫn Kịch Bản Test (QA / Tester)

Dưới đây là một số luồng nghiệp vụ quan trọng bạn cần kiểm thử (Test Cases):

### 1. Luồng Xác thực (Authentication)
- **Đăng ký:** Truy cập `/register`. Thử tạo 1 tài khoản với "Mã phân quyền" trống (Sẽ thành Học sinh). Nếu gõ "GV2026_QUIZ_AI" thành Giáo viên, "ADMIN_SUPREME_99" thành Quản trị.
- **Đăng nhập:** Truy cập `/login` xem có đăng nhập thành công và token được nhét vào LocalStorage không.
- **Quên mật khẩu:** Ở form Login, chọn "Quên mật khẩu", điền Email. (Theo dõi log Backend để bắt link đổi mk nếu bạn không cắm Email thực). Mở link chuyển sang `/reset-password` và nhập mật khẩu mới.

### 2. Phân Hệ Nạp Dữ Liệu AI (Upload Center)
- **Truy cập:** `/upload` (Chỉ Teacher/Admin vào được, thử bằng acc Student xem có bị sút ra không).
- **Tính năng:** Tải lên các file (txt, docx, pdf - được hỗ trợ native OCR qua Gemini) hoặc Paste link URL vào. Bấm Phân tích xem AI có xuất ra thẻ Tag và Tóm tắt chưa.
- **Save:** Nhấn công khai sẽ lưu gói học liệu mới vào Database. 

### 3. Trắc Nghiệm Thông Minh & Phân Quyền
- Vòng lặp Học & Test: Chọn tài liệu ở Home. Học ở `/learn/:id` -> Chọn Thi Thử (`/quiz/start`) -> Xem kết quả thống kê tại (`/result`).
- Phân quyền Admin: Vào mục `/admin` để kiểm tra các Dashboard tổng quát hệ thống. Mọi luồng API trái phép sẽ bị Backend văng mã 400/401/403.

---

**✨ Cảm ơn bạn đã tham gia đội ngũ phát triển tài năng của QuizVibe! Happy Coding! ✨**
