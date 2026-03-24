const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Hàm Đăng ký (Đã cập nhật logic chặt chẽ của bạn)
exports.register = async (req, res) => {
    try {
        const { name, email, password, secretCode } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: "Email đã tồn tại" });

        let assignedRoleId = 1; // Mặc định là Student

        if (secretCode) {
            if (secretCode === process.env.ADMIN_SECRET_CODE) {
                assignedRoleId = 3;
            } else if (secretCode === process.env.TEACHER_SECRET_CODE) {
                assignedRoleId = 2;
            } else {
                return res.status(401).json({
                    message: "Mã bí mật không hợp lệ. Vui lòng liên hệ Admin hoặc đăng ký tài khoản Student (để trống mã)."
                });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password_hash: hashedPassword,
            role_id: assignedRoleId
        });

        res.status(201).json({
            message: "Đăng ký thành công!",
            role_id: assignedRoleId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Hàm Đăng nhập (BẠN CẦN PHẢI CÓ HÀM NÀY Ở ĐÂY)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Mật khẩu không chính xác" });

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role_id: user.role_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- HÀM ĐỔI MẬT KHẨU ---
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id; // Lấy từ authMiddleware

        // 1. Tìm user trong DB theo ID
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
        }

        // 3. Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật vào Database
        user.password_hash = hashedNewPassword;
        await user.save();

        res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};