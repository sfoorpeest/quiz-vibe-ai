const emailService = require('../services/emailService');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin.", data: null, errorCode: "MISSING_FIELDS" });
        }

        const emailValidation = await emailService.validateContactEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({
                success: false,
                message: "Email không hợp lệ hoặc tên miền không thể nhận thư.",
                data: null,
                errorCode: "INVALID_EMAIL"
            });
        }

        // 1. Send notification to admin
        await emailService.sendSupportNotificationToAdmin({ name, email: emailValidation.normalized, message });

        // 2. Send confirmation to user
        await emailService.sendSupportConfirmationToUser(emailValidation.normalized, name);

        res.status(200).json({ success: true, message: "Yêu cầu đã được gửi thành công!", data: null, errorCode: null });
    } catch (error) {
        console.error("Submit Contact Error:", error);
        if (error?.code === 'EMAIL_DELIVERY_FAILED') {
            return res.status(502).json({ success: false, message: "Không thể gửi email tại thời điểm này. Vui lòng thử lại sau.", data: null, errorCode: "EMAIL_DELIVERY_FAILED" });
        }
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.", data: null, errorCode: "SUBMIT_CONTACT_FAILED" });
    }
};
