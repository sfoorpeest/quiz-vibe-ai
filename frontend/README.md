# 🌌 QuizVibe AI - Frontend: The Neon Observatory 🚀

Chào mừng bạn đến với phân hệ giao diện của **QuizVibe AI** - Một hệ sinh thái học tập hiện đại, kết hợp giữa sức mạnh của Trí tuệ nhân tạo (AI) và trải nghiệm trò chơi hóa (Gamification) đỉnh cao.

Dự án này không chỉ đơn thuần là một website, mà là một **"Đài quan sát Neon" (Neon Observatory)** - nơi tri thức được trình diễn dưới dạng các đấu trường kịch tính, giúp người học không còn cảm thấy nhàm chán.

---

## 💎 Tầm Nhìn Thiết Kế (The "Wow" Aesthetics)
Frontend của QuizVibe AI được xây dựng dựa trên triết lý **Premium & Immersive**:
- **Glassmorphism:** Toàn bộ giao diện sử dụng các lớp phủ mờ (backdrop-blur) cao cấp, tạo cảm giác chiều sâu và hiện đại.
- **Neon Observatory Theme:** Tông màu tối (Dark mode) kết hợp với các dải đèn Neon (Cyan, Fuchsia, Amber) tạo sự tập trung tối đa và phong cách Esports.
- **Dynamic Advanced Background:** Hệ thống nền động với lưới (Grid) chuyển động, các hạt Neon Orbs mờ ảo và hiệu ứng Scanline điện tử.
- **Micro-animations:** Sử dụng `Framer Motion` để tạo các chuyển động mượt mà khi di chuyển giữa các trang, hover vào các phần tử hoặc khi thông tin mới xuất hiện.

---

## 🛠 Lộ trình Công nghệ (Tech Stack)
| Công nghệ | Vai trò |
| :--- | :--- |
| **React 19** | Thư viện lõi, quản lý Component và Rendering. |
| **Vite 6** | Build tool siêu tốc cho trải nghiệm Developer mượt mà. |
| **Tailwind CSS v4** | Hệ thống Styling tiện ích, tối ưu hiệu năng và linh hoạt cực cao. |
| **Framer Motion** | Engine chuyển động cho các hiệu ứng Premium. |
| **Socket.io Client** | Kết nối thời gian thực cho Đấu trường Live Challenge. |
| **React Router v7** | Quản lý điều hướng và bảo vệ tuyến đường (Private Routes). |
| **Lucide React** | Hệ thống icon tối giản và hiện đại. |
| **Axios** | Xử lý request API với Interceptors để quản lý Auth Token. |

---

## 🕹️ Hệ Sinh Thái Chức Năng (Core Ecosystem)

### 1. ⚔️ Đấu Trường Tri Thức (Edu Games)
Đây là "trái tim" của sự tương tác trong ứng dụng:
- **Solo Adventure:** Chế độ thám hiểm cá nhân. Người chơi đối mặt với các bộ câu hỏi được AI tạo ra dựa trên học liệu cá nhân hoặc ngẫu nhiên.
- **Live Challenge (Esports Arena):** Chế độ đấu trực tuyến thời gian thực (Multiplayer). 
    - Hỗ trợ Handshake đồng bộ hóa để đảm bảo tất cả người chơi bắt đầu cùng lúc.
    - Bảng xếp hạng trực tiếp cập nhật theo từng giây (Real-time Leaderboard).
    - Hiệu ứng đếm ngược kịch tính với âm thanh và rung (pending).

### 2. 🧠 Trung Tâm Tải Lên & Phân Tích (AI Upload Center)
- Hỗ trợ tải lên PDF, Word, TXT hoặc dán URL trang web.
- Tích hợp OCR và phân tích nội dung tự động thông qua Gemini API.
- Tự động tạo thẻ (Tags), tóm tắt và **đặc biệt là tạo bộ câu hỏi trắc nghiệm tự động** chỉ trong vài giây.

### 3. 🎖️ Thành Tích & Hồ Sơ (Profile & Gamification)
- **Hệ thống Huy hiệu (Badges):** Tự động mở khóa các danh hiệu dựa trên hoạt động (Ví dụ: "Học giả Siêu cấp", "Thợ săn Điểm số").
- **Hệ thống XP & Rank:** Tính toán điểm số và thứ hạng của người chơi trên toàn hệ thống.
- **Dashboard cá nhân:** Quản lý học liệu đã lưu, lịch sử thi đấu và cài đặt riêng tư.

---

## 📂 Kiến trúc Thư mục (Folder Structure)

```bash
src/
├── api/             # Cấu hình Axios & Interceptors (Gắn JWT vào Header).
├── components/      # Các Component nguyên tử và phức hợp:
│   ├── ui/          # Các thành phần giao diện nhỏ (Button, Input, Badge).
│   ├── games/       # Các logic và UI riêng cho Edu Games.
│   └── shared/      # AdvancedBackground, Navbar, Sidebar dùng chung.
├── context/         # AuthContext: Quản lý đăng nhập và trạng thái User toàn cục.
├── hooks/           # Các Custom Hooks để xử lý logic Socket, Timer,...
├── pages/           # Các trang giao diện chính (Home, Upload, Games, Profile...).
├── services/        # Các hàm gọi API Backend (auth, quiz, achievement...).
└── styles/          # Cấu hình CSS toàn cục và các Keyframes cho Animation.
```

---

## ⚙️ Hướng dẫn Cài Đặt (Developer Guide)

### Yêu cầu hệ thống:
- **Node.js:** v18.0.0 trở lên.
- **Backend:** Phải đang chạy (thường là `http://localhost:5000`).

### Các bước cài đặt:
1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```
2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```
3. **Cấu hình biến môi trường:**
   Tạo file `.env` (nếu chưa có) và trỏ tới URL của Backend:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. **Chạy ở chế độ phát triển:**
   ```bash
   npm run dev
   ```
   *Truy cập `http://localhost:5173` để trải nghiệm.*

---

## 🧪 Tài liệu Kiểm Thử (Testing Scenarios)

Dành cho Tester để xác nhận hệ thống vận hành đúng:

1. **Test Real-time (Live Challenge):** 
   - Mở 2 trình duyệt khác nhau, đăng nhập bằng 2 tài khoản.
   - Cùng tham gia vào Live Challenge.
   - Kiểm tra xem câu hỏi có hiển thị đồng thời và điểm số có cập nhật chéo cho nhau không.
2. **Test AI Generation:** 
   - Tải lên một file PDF nội dung bất kỳ.
   - Chờ AI phân tích và kiểm tra xem danh sách câu hỏi tạo ra có bám sát nội dung file không.
3. **Test Responsive:** 
   - Sử dụng DevTools để chuyển sang chế độ Mobile.
   - Kiểm tra xem các thẻ câu hỏi và bảng xếp hạng có hiển thị gọn gàng không.

---

**✨ QuizVibe AI - Nâng tầm tri thức, chinh phục thử thách! ✨**
*(Dự án được phát triển với niềm đam mê mãnh liệt dành cho công nghệ và giáo dục).*
