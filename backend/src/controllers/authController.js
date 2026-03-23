const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- HÀM ĐĂNG KÝ (Kiểm tra nghiêm ngặt mã bí mật & Tự động đăng nhập) ---
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, secretCode } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: "Email đã tồn tại" });

        // Theo dõi role được gán
        let assignedRoleId = 1; // Học sinh

        // Kiểm tra nghiêm ngặt mã phân quyền
        if (role === 'admin') {
            if (secretCode !== process.env.ADMIN_SECRET_CODE) {
                return res.status(400).json({ message: "Mã bí mật Admin không chính xác!" });
            }
            assignedRoleId = 3;
        } else if (role === 'teacher') {
            if (secretCode !== process.env.TEACHER_SECRET_CODE) {
                return res.status(400).json({ message: "Mã bí mật Giáo viên không chính xác!" });
            }
            assignedRoleId = 2;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password_hash: hashedPassword,
            role_id: assignedRoleId 
        });

        // Tạo JWT Token y hệt như đăng nhập để Client lưu vào LocalStorage
        const token = jwt.sign(
            { id: newUser.id, role_id: newUser.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Trả về user và token
        res.status(201).json({ 
            message: "Đăng ký thành công!", 
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role_id: newUser.role_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- HÀM ĐĂNG NHẬP (Đăng nhập bằng Email) ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Mật khẩu không chính xác" });

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id }, // Payload quan trọng cho middleware
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
                role_id: user.role_id // Trả về để FE xử lý giao diện
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
