const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 1. Thêm thư viện JWT

// --- HÀM ĐĂNG KÝ (Giữ nguyên của bạn) ---
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const nameExists = await User.findOne({ where: { name } });
        if (nameExists) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email đã tồn tại" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password_hash: hashedPassword,
            role_id: 1 
        });

        res.status(201).json({ message: "Đăng ký thành công!", userId: newUser.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- HÀM ĐĂNG NHẬP (Bổ sung mới) ---
exports.login = async (req, res) => {
    try {
        const { name, password } = req.body;

        // 1. Tìm user trong DB theo tên (thay vì email)
        const user = await User.findOne({ where: { name } });
        if (!user) {
            return res.status(404).json({ message: "Tên đăng nhập không tồn tại" });
        }

        // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không chính xác" });
        }

        // 3. Tạo JWT Token (Sử dụng JWT_SECRET từ file .env)
        // Token này sẽ chứa ID và Quyền của user, hết hạn sau 24 giờ
        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Trả về Token và thông tin cơ bản của User
        res.json({
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};