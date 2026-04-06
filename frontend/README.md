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
3. **Trang chức năng cá nhân (Khu vực Hội viên):**
   - Hồ sơ cá nhân: `Profile.jsx` (Gồm 4 tab: Tổng quan, Khóa học, Đã lưu, Cài đặt).
   - Chỉnh sửa thông tin: `ProfileInfo.jsx`, `ProfileBio.jsx`, `ProfileHeader.jsx`.
   - Lịch sử hoạt động: `ProfileActivity.jsx`.
   - Cài đặt tài khoản: `ProfileSettings.jsx`.
   - Trang Liên hệ & Trợ giúp: `ContactPage.jsx` (Gửi mail trực tiếp cho Admin).
   - Các trang tĩnh: `TermsPage.jsx` (Điều khoản), `PrivacyPage.jsx` (Chính sách bảo mật).

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
  - **Tài khoản Test Email (Dành cho Tester):**
    - `EMAIL_USER=leminhphan1@gmail.com`
    - `EMAIL_PASS=orxpfvlnsytgxkig` (Sử dụng mật khẩu ứng dụng này để cấu hình biến môi trường tại Backend `.env` nếu muốn test gửi mail thật).

### 2. Phân Hệ Nạp Dữ Liệu AI (Upload Center)
- **Truy cập:** `/upload` (Chỉ Teacher/Admin vào được, thử bằng acc Student xem có bị sút ra không).
- **Tính năng:** Tải lên các file (txt, docx, pdf - được hỗ trợ native OCR qua Gemini) hoặc Paste link URL vào. Bấm Phân tích xem AI có xuất ra thẻ Tag và Tóm tắt chưa.
- **Save:** Nhấn công khai sẽ lưu gói học liệu mới vào Database. 

### 4. Quản lý Hồ sơ & Cài đặt (Profile Management)
- **Truy cập:** `/profile`. Thử nghiệm chuyển đổi giữa các Tab (Tổng quan, Khóa học, Đã lưu, Cài đặt).
- **Cập nhật thông tin:** Thử đổi Tên, Bio, Địa chỉ hoặc Avatar. Kiểm tra xem dữ liệu có được lưu vào Database và cập nhật ngay lên Navbar không.
- **Tính năng private:** Thử bật/tắt quyền riêng tư hồ sơ hoặc nhận thông báo email tại Tab Cài đặt.

### 5. Luồng Hỗ trợ & Liên hệ (Support & Contact)
- **Truy cập:** `/contact`.
- **Gửi yêu cầu:** Nhập nội dung báo lỗi hoặc góp ý.
- **Kiểm tra Mail:** 
  - Admin (EMAIL_USER) sẽ nhận được một **Support Ticket** có đầy đủ thông tin người gửi.
  - Người dùng sẽ nhận được một **Email xác nhận** tự động thông báo hệ thống đã tiếp nhận yêu cầu.
- **Điều hướng:** Kiểm tra các link dẫn tới Điều khoản & Chính sách trong trang Liên hệ hoặc trang Đăng ký.

---

**✨ Cảm ơn bạn đã tham gia đội ngũ phát triển tài năng của QuizVibe! Happy Coding! ✨**
