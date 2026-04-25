const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const eduRoutes = require('./routes/eduRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const contactRoutes = require('./routes/contactRoutes');
const materialRoutes = require('./routes/materialRoutes');
const myLessonRoutes = require('./routes/myLessonRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Thêm route cho chat
const path = require('path');
const http = require('http'); // Import http để tạo server chung cho Express và Socket
const { initSocket } = require('./socket/socket'); // Import hàm khởi tạo socket
require('dotenv').config();

const { connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app); // Tạo HTTP server từ app Express

// Khởi tạo Socket.IO và lưu instance 'io' vào app để các controller có thể truy cập
// Workflow: chatController cần io để emit event đến receiver sau khi upload/forward file
const io = initSocket(server);
app.set('io', io); // Gắn io vào app để dùng qua req.app.get('io')

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // Cho phép load ảnh cross-origin
app.use(cors()); // Cho phép FE truy cập
app.use(morgan('dev')); // Log request ra console
app.use(express.json()); // Đọc dữ liệu JSON từ request body
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/edu', eduRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/materials', materialRoutes);
app.use('/my-lessons', myLessonRoutes);
app.use('/api/chat', chatRoutes); // Đăng ký route chat

// Phục vụ file tĩnh (ảnh avatar)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Phục vụ file tĩnh chat (PDF, DOCX, TXT được upload qua chat)
// URL format: /chat-files/1745678901234-filename.pdf
app.use('/chat-files', express.static(path.join(__dirname, '../uploads/chat-files')));

// Kết nối Database
connectDB();

// Route kiểm tra server
app.get('/', (req, res) => {
    res.json({ message: "Welcome to Education Quiz AI API" });
});

const PORT = process.env.PORT || 5000;
// Lắng nghe trên 'server' thay vì 'app' để Socket.IO cũng hoạt động được
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});