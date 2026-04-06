const emailService = require('../services/emailService');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin." });
        }

        // Email validation could be added here if needed, but frontend already does basic check

        // 1. Send notification to admin
        await emailService.sendSupportNotificationToAdmin({ name, email, message });

        // 2. Send confirmation to user
        await emailService.sendSupportConfirmationToUser(email, name);

        res.status(200).json({ message: "Yêu cầu đã được gửi thành công!" });
    } catch (error) {
        console.error("Submit Contact Error:", error);
        res.status(500).json({ message: "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau." });
    }
};
