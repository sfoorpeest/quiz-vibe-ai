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
        if (userExists) return res.status(400).json({ success: false, message: "Email đã tồn tại", data: null, errorCode: "EMAIL_EXISTS" });

        let assignedRoleId = 1; // Mặc định là Student

        if (secretCode) {
            if (secretCode === process.env.ADMIN_SECRET_CODE) {
                assignedRoleId = 3;
            } else if (secretCode === process.env.TEACHER_SECRET_CODE) {
                assignedRoleId = 2;
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Mã xác thực Admin không đúng. Vui lòng nhập đúng mã để đăng ký.",
                    data: null,
                    errorCode: "INVALID_SECRET_CODE"
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

        console.log(`✅ User registered: ${newUser.email} (Role ID: ${assignedRoleId})`);

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công!",
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role_id: assignedRoleId
            },
            errorCode: null
        });
    } catch (error) {
        console.error("❌ Registration Error Details:", error);
        res.status(500).json({ 
            success: false,
            message: "Lỗi hệ thống khi đăng ký. Vui lòng kiểm tra console backend.",
            data: null,
            errorCode: "REGISTER_FAILED"
        });
    }
};

// 2. Hàm Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing credentials", data: null, errorCode: "MISSING_CREDENTIALS" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials", data: null, errorCode: "INVALID_CREDENTIALS" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials", data: null, errorCode: "INVALID_CREDENTIALS" });

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công!",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role_id: user.role_id
                }
            },
            errorCode: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng nhập.", data: null, errorCode: "LOGIN_FAILED" });
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
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại", data: null, errorCode: "USER_NOT_FOUND" });
        }

        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác", data: null, errorCode: "WRONG_OLD_PASSWORD" });
        }

        // 3. Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật vào Database
        user.password_hash = hashedNewPassword;
        await user.save();

        res.json({ success: true, message: "Đổi mật khẩu thành công!", data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi mật khẩu.", data: null, errorCode: "CHANGE_PASSWORD_FAILED" });
    }
};

// --- HÀM QUÊN MẬT KHẨU (Gửi mail & In ra Log) ---
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống.", data: null, errorCode: "EMAIL_NOT_FOUND" });
        }

        // Tạo token ngẫu nhiên và hết hạn sau 15 phút
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); 

        // Lưu vào DB
        user.resetToken = resetToken;
        user.resetTokenExpires = resetTokenExpires;
        await user.save();

        const resetLink = `http://localhost:5173/forgot-password?token=${resetToken}`;

        // =========================================================================
        // 🛠️ DEVELOPMENT LOGGING (DÀNH CHO TEAM FE & TESTER)
        // GHI CHÚ: Đoạn code này dùng để in trực tiếp Link Reset ra Terminal của Server.
        // Giúp anh em test tính năng Quên mật khẩu với các tài khoản giả (fake email) 
        // mà không cần phải vào hộp thư thật để kiểm tra.
        //
        // ⚠️ QUAN TRỌNG: KHI DEPLOY LÊN PRODUCTION ĐỂ NGƯỜI DÙNG THỰC SỬ DỤNG, 
        // BẮT BUỘC PHẢI COMMENT HOẶC XÓA ĐOẠN CONSOLE.LOG NÀY ĐỂ BẢO MẬT TOKEN!
        // =========================================================================
        if (process.env.NODE_ENV !== "production") {
            console.log("\n==========================================");
            console.log("🔑 [DEV MODE] LINK ĐẶT LẠI MẬT KHẨU:");
            console.log(resetLink);
            console.log("==========================================\n");
        }

        // Cố gắng gửi mail. Nếu dùng email giả, có thể báo lỗi nhưng luồng vẫn đi tiếp
        try {
            await sendResetEmail(email, resetLink);
        } catch (mailError) {
            console.log(`⚠️ Không thể gửi mail tới ${email} (Có thể do email giả/sai cấu hình). Vui lòng dùng link ở Terminal để test tiếp.`);
        }

        res.json({ success: true, message: "Yêu cầu đã được xử lý. Vui lòng kiểm tra hộp thư Email của bạn để nhận đường dẫn đặt lại mật khẩu.", data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xử lý yêu cầu đặt lại mật khẩu.", data: null, errorCode: "FORGOT_PASSWORD_FAILED" });
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
            return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn.", data: null, errorCode: "INVALID_RESET_TOKEN" });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật Database
        user.password_hash = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.json({ success: true, message: "Mật khẩu đã được cập nhật thành công!", data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đặt lại mật khẩu.", data: null, errorCode: "RESET_PASSWORD_FAILED" });
    }
};

// --- HÀM LẤY THÔNG TIN HỒ SƠ ---
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password_hash', 'resetToken', 'resetTokenExpires'] }
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại", data: null, errorCode: "USER_NOT_FOUND" });
        }
        res.json({ success: true, message: "Lấy thông tin thành công.", data: user, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy thông tin.", data: null, errorCode: "GET_ME_FAILED" });
    }
};

// --- HÀM CẬP NHẬT HỒ SƠ CHI TIẾT ---
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại", data: null, errorCode: "USER_NOT_FOUND" });
        }
        
        if (name) {
            user.name = name;
        }
        
        await user.save();
        res.json({ 
            success: true,
            message: "Cập nhật hồ sơ thành công",
            data: { id: user.id, name: user.name, email: user.email, role_id: user.role_id },
            errorCode: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật hồ sơ.", data: null, errorCode: "UPDATE_PROFILE_FAILED" });
    }
};