const { Op } = require('sequelize');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Controller: Lấy lịch sử chat giữa người dùng hiện tại và một người dùng khác
 * Workflow:
 * 1. Nhận userId của người đang được chat cùng từ params.
 * 2. Lấy ID của người dùng hiện tại từ req.user (được gán bởi authMiddleware).
 * 3. Truy vấn bảng Messages để tìm tất cả tin nhắn thỏa mãn:
 *    (sender = current_user VÀ receiver = other_user) 
 *    HOẶC (sender = other_user VÀ receiver = current_user).
 * 4. Sắp xếp theo thời gian tăng dần để hiển thị đúng thứ tự trên UI.
 */
exports.getChatHistory = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        if (!otherUserId) {
            return res.status(400).json({ message: "Thiếu thông tin người nhận (userId)" });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: currentUserId, receiver_id: otherUserId },
                    { sender_id: otherUserId, receiver_id: currentUserId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'Sender',
                    attributes: ['id', 'name'] // Chỉ lấy những thông tin cơ bản
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error("❌ Get Chat History Error:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy lịch sử chat" });
    }
};

/**
 * Controller: Lấy danh sách những người có thể chat (Lịch sử nhắn tin gần đây)
 * Workflow:
 * 1. Truy vấn bảng Messages để tìm tất cả tin nhắn gửi hoặc nhận bởi current_user.
 * 2. Lọc ra các user ID độc nhất.
 * 3. Truy vấn bảng Users để lấy thông tin những người đó.
 */
exports.getContacts = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Lấy tất cả tin nhắn liên quan đến user hiện tại
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: currentUserId },
                    { receiver_id: currentUserId }
                ]
            },
            attributes: ['sender_id', 'receiver_id']
        });

        // Tìm các ID người dùng khác mà user này đã tương tác
        const userIds = new Set();
        messages.forEach(msg => {
            if (msg.sender_id !== currentUserId) userIds.add(msg.sender_id);
            if (msg.receiver_id !== currentUserId) userIds.add(msg.receiver_id);
        });

        // Nếu chưa từng nhắn cho ai
        if (userIds.size === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const contacts = await User.findAll({
            where: {
                id: Array.from(userIds)
            },
            attributes: ['id', 'name', 'email', 'role_id']
        });

        res.status(200).json({
            success: true,
            data: contacts
        });

    } catch (error) {
        console.error("❌ Get Contacts Error:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy danh bạ" });
    }
};

/**
 * Controller: Tìm kiếm người dùng (để bắt đầu trò chuyện mới)
 */
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim() === '') {
            return res.status(200).json({ success: true, data: [] });
        }

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: currentUserId } }, // Không tìm chính mình
                    {
                        [Op.or]: [
                            { name: { [Op.like]: `%${q}%` } },
                            { email: { [Op.like]: `%${q}%` } }
                        ]
                    }
                ]
            },
            limit: 15,
            attributes: ['id', 'name', 'email', 'role_id']
        });

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error("❌ Search Users Error:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi tìm kiếm người dùng" });
    }
};

