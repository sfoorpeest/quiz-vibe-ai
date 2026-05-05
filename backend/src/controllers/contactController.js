const emailService = require('../services/emailService');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin.", data: null, errorCode: "MISSING_FIELDS" });
        }

        // Email validation could be added here if needed, but frontend already does basic check

        // 1. Send notification to admin
        await emailService.sendSupportNotificationToAdmin({ name, email, message });

        // 2. Send confirmation to user
        await emailService.sendSupportConfirmationToUser(email, name);

        res.status(200).json({ success: true, message: "Yêu cầu đã được gửi thành công!", data: null, errorCode: null });
    } catch (error) {
        console.error("Submit Contact Error:", error);
        res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.", data: null, errorCode: "SUBMIT_CONTACT_FAILED" });
    }
};
