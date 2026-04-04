const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Thêm thư viện này (có sẵn trong Node)
const { Op } = require('sequelize'); // Cần để so sánh thời gian
const { sendResetEmail } = require('../services/emailService');

// 1. Hàm Đăng ký 
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
                    message: "Mã xác thực Admin không đúng. Vui lòng nhập đúng mã để đăng ký."
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

// 2. Hàm Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(404).json({ message: "Tài khoản không tồn tại" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Vui lòng cung cấp đầy đủ Email và Mật khẩu" });

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

// --- HÀM QUÊN MẬT KHẨU (Gửi mail & In ra Log) ---
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại trong hệ thống." });
        }

        // Tạo token ngẫu nhiên và hết hạn sau 15 phút
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); 

        // Lưu vào DB
        user.resetToken = resetToken;
        user.resetTokenExpires = resetTokenExpires;
        await user.save();

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        // =========================================================================
        // 🛠️ DEVELOPMENT LOGGING (DÀNH CHO TEAM FE & TESTER)
        // GHI CHÚ: Đoạn code này dùng để in trực tiếp Link Reset ra Terminal của Server.
        // Giúp anh em test tính năng Quên mật khẩu với các tài khoản giả (fake email) 
        // mà không cần phải vào hộp thư thật để kiểm tra.
        //
        // ⚠️ QUAN TRỌNG: KHI DEPLOY LÊN PRODUCTION ĐỂ NGƯỜI DÙNG THỰC SỬ DỤNG, 
        // BẮT BUỘC PHẢI COMMENT HOẶC XÓA ĐOẠN CONSOLE.LOG NÀY ĐỂ BẢO MẬT TOKEN!
        // =========================================================================
        console.log("\n==========================================");
        console.log("🔑 [DEV MODE] LINK ĐẶT LẠI MẬT KHẨU:");
        console.log(resetLink);
        console.log("==========================================\n");

        // Cố gắng gửi mail. Nếu dùng email giả, có thể báo lỗi nhưng luồng vẫn đi tiếp
        try {
            await sendResetEmail(email, resetLink);
        } catch (mailError) {
            console.log(`⚠️ Không thể gửi mail tới ${email} (Có thể do email giả/sai cấu hình). Vui lòng dùng link ở Terminal để test tiếp.`);
        }

        res.json({ message: "Yêu cầu đã được xử lý. Link đặt lại mật khẩu đã được tạo (Xem tại Terminal nếu dùng email ảo)." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- HÀM ĐẶT LẠI MẬT KHẨU MỚI ---
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Tìm user có token khớp và thời gian hết hạn lớn hơn hiện tại
        const user = await User.findOne({ 
            where: { 
                resetToken: token,
                resetTokenExpires: { [Op.gt]: new Date() } 
            } 
        });

        if (!user) {
            return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật Database
        user.password_hash = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.json({ message: "Mật khẩu đã được cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};