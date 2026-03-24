const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const eduRoutes = require('./routes/eduRoutes');

require('dotenv').config();

const { connectDB } = require('./config/database');

const app = express();

// Middleware
app.use(helmet()); // Bảo mật header
app.use(cors()); // Cho phép FE truy cập
app.use(morgan('dev')); // Log request ra console
app.use(express.json()); // Đọc dữ liệu JSON từ request body
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/edu', eduRoutes);

// Kết nối Database
connectDB();

// Route kiểm tra server
app.get('/', (req, res) => {
    res.json({ message: "Welcome to Education Quiz AI API" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});