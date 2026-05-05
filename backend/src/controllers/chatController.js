const { Op } = require('sequelize');
const Message = require('../models/Message');
const User = require('../models/User');
const { onlineUsers } = require('../socket/socket');

/**
 * Controller: chatController
 * 
 * Xử lý toàn bộ logic HTTP cho chức năng chat:
 * - Lấy lịch sử tin nhắn
 * - Lấy danh bạ (những người đã nhắn tin)
 * - Tìm kiếm người dùng mới
 * - Upload và gửi file qua chat
 * - Đánh dấu tin nhắn đã xem (seen)
 * - Chuyển tiếp (forward) file sang user khác
 */


/**
 * [GET] /api/chat/history/:userId
 * Lấy lịch sử chat giữa người dùng hiện tại và một người dùng khác.
 * 
 * Workflow:
 * 1. Nhận userId của người đang được chat cùng từ params.
 * 2. Lấy ID của người dùng hiện tại từ req.user (được gán bởi authMiddleware).
 * 3. Truy vấn bảng Messages để tìm tất cả tin nhắn giữa 2 người.
 * 4. Sắp xếp theo thời gian tăng dần để hiển thị đúng thứ tự trên UI.
 */
exports.getChatHistory = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        if (!otherUserId) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin người nhận (userId)", data: null, errorCode: "MISSING_USER_ID" });
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
                    attributes: ['id', 'name'] // Chỉ lấy thông tin cần thiết
                }
            ]
        });

        res.status(200).json({ success: true, message: "Lấy lịch sử chat thành công", data: messages, errorCode: null });

    } catch (error) {
        console.error("❌ Get Chat History Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy lịch sử chat", data: null, errorCode: "GET_CHAT_HISTORY_FAILED" });
    }
};


/**
 * [GET] /api/chat/contacts
 * Lấy danh sách những người có thể chat (Lịch sử nhắn tin gần đây).
 * 
 * Workflow:
 * 1. Tìm tất cả tin nhắn gửi hoặc nhận bởi current_user.
 * 2. Lọc ra các user ID độc nhất đã từng tương tác.
 * 3. Truy vấn bảng Users để lấy thông tin hiển thị.
 */
exports.getContacts = async (req, res) => {
    try {
        const currentUserId = req.user.id;

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

        if (userIds.size === 0) {
            return res.status(200).json({ success: true, message: "Lấy danh bạ thành công", data: [], errorCode: null });
        }

        const contacts = await User.findAll({
            where: { id: Array.from(userIds) },
            attributes: ['id', 'name', 'email', 'role_id']
        });

        res.status(200).json({ success: true, message: "Lấy danh bạ thành công", data: contacts, errorCode: null });

    } catch (error) {
        console.error("❌ Get Contacts Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh bạ", data: null, errorCode: "GET_CONTACTS_FAILED" });
    }
};


/**
 * [GET] /api/chat/search
 * Tìm kiếm người dùng để bắt đầu trò chuyện mới.
 * Không trả về chính bản thân người đang tìm kiếm.
 */
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim() === '') {
            return res.status(200).json({ success: true, message: "Tìm kiếm thành công", data: [], errorCode: null });
        }

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: currentUserId } }, // Loại trừ bản thân
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

        res.status(200).json({ success: true, message: "Tìm kiếm người dùng thành công", data: users, errorCode: null });

    } catch (error) {
        console.error("❌ Search Users Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tìm kiếm người dùng", data: null, errorCode: "SEARCH_USERS_FAILED" });
    }
};


/**
 * [POST] /api/chat/upload
 * Upload file và tạo tin nhắn loại 'file' trong cuộc trò chuyện.
 * 
 * Phân quyền upload:
 * - role_id = 2 (Giáo viên): Được phép upload
 * - role_id = 3 (Admin): Được phép upload
 * - role_id = 1 (Học sinh): KHÔNG được phép upload mới (chỉ có thể forward)
 * 
 * Workflow:
 * 1. Kiểm tra quyền của người dùng dựa trên role_id.
 * 2. Multer đã xử lý file và lưu vào disk trước khi vào đây (via middleware).
 * 3. Tạo bản ghi Message mới với type='file' và thông tin file.
 * 4. Emit qua socket đến người nhận nếu họ đang online.
 * 5. Trả về messagePayload để frontend cập nhật UI ngay lập tức.
 * 
 * Body (multipart/form-data):
 * - file: File được upload
 * - receiver_id: ID người nhận
 * - content: (optional) Lời nhắn kèm theo file
 */
exports.uploadFile = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role_id;

        // --- Kiểm tra quyền upload ---
        // Chỉ Giáo viên (role_id=2) và Admin (role_id=3) mới được upload file mới
        if (currentUserRole === 1) {
            // Xóa file đã lưu tạm (nếu multer đã lưu)
            if (req.file) {
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({ success: false, message: "Học sinh không có quyền upload tài liệu. Bạn chỉ có thể chuyển tiếp tài liệu đã nhận.", data: null, errorCode: "UPLOAD_FORBIDDEN" });
        }

        // --- Kiểm tra file có tồn tại không ---
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Không tìm thấy file được upload", data: null, errorCode: "NO_FILE" });
        }

        const { receiver_id, content } = req.body;

        if (!receiver_id) {
            return res.status(400).json({ success: false, message: "Thiếu receiver_id", data: null, errorCode: "MISSING_RECEIVER_ID" });
        }

        // --- Tạo đường dẫn tương đối để lưu vào DB ---
        // Frontend sẽ ghép với VITE_API_URL để tạo URL đầy đủ
        const relativeFilePath = `/chat-files/${req.file.filename}`;

        // --- Lưu tin nhắn vào Database ---
        const newMessage = await Message.create({
            sender_id: currentUserId,
            receiver_id: parseInt(receiver_id),
            content: content || null,     // Lời nhắn tùy chọn kèm file
            type: 'file',
            file_path: relativeFilePath,
            file_name: req.file.originalname, // Tên gốc để hiển thị
            file_type: req.file.mimetype,     // MIME type
            status: 'sent',
            is_forwarded: false
        });

        // --- Lấy thông tin người gửi để đính kèm vào response ---
        const sender = await User.findByPk(currentUserId, {
            attributes: ['id', 'name']
        });

        const messagePayload = {
            ...newMessage.toJSON(),
            Sender: sender
        };

        // --- Emit qua Socket đến người nhận (nếu online) ---
        // Import onlineUsers từ socket module để tìm socket ID của receiver
        const io = req.app.get('io');
        const receiverSocketId = onlineUsers.get(parseInt(receiver_id));

        if (receiverSocketId && io) {
            // Gửi tin nhắn đến receiver
            io.to(receiverSocketId).emit('receive_message', messagePayload);

            // Cập nhật status thành 'delivered' vì receiver đang online
            await newMessage.update({ status: 'delivered' });
            messagePayload.status = 'delivered';

            // Thông báo cho sender biết message đã được delivered
            const senderSocketId = onlineUsers.get(currentUserId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('message_delivered', {
                    messageId: newMessage.id,
                    status: 'delivered'
                });
            }
        }

        res.status(201).json({ success: true, message: "Upload file thành công", data: messagePayload, errorCode: null });

    } catch (error) {
        console.error("❌ Upload File Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi upload file", data: null, errorCode: "UPLOAD_FILE_FAILED" });
    }
};


/**
 * [PUT] /api/chat/seen/:senderId
 * Đánh dấu tất cả tin nhắn từ senderId → currentUser là 'seen'.
 * 
 * Được gọi khi người dùng mở một cuộc trò chuyện (chọn contact).
 * 
 * Workflow:
 * 1. Update tất cả tin nhắn chưa seen từ senderId đến currentUser.
 * 2. Emit event 'messages_seen' đến sender (nếu đang online) để cập nhật icon tick.
 */
exports.markMessagesAsSeen = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const senderId = parseInt(req.params.senderId);

        // --- Cập nhật tất cả tin nhắn chưa được xem ---
        const [updatedCount] = await Message.update(
            { status: 'seen' },
            {
                where: {
                    sender_id: senderId,
                    receiver_id: currentUserId,
                    status: { [Op.ne]: 'seen' } // Chỉ update những tin chưa seen
                }
            }
        );

        // --- Thông báo cho sender biết tin nhắn đã được xem ---
        if (updatedCount > 0) {
            const io = req.app.get('io');
            const senderSocketId = onlineUsers.get(senderId);

            if (senderSocketId && io) {
                io.to(senderSocketId).emit('messages_seen', {
                    by: currentUserId,   // Ai đã xem
                    from: senderId       // Tin nhắn của ai được xem
                });
            }
        }

        res.status(200).json({ success: true, message: `Đã đánh dấu ${updatedCount} tin nhắn là đã xem`, data: null, errorCode: null });

    } catch (error) {
        console.error("❌ Mark Seen Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật trạng thái tin nhắn", data: null, errorCode: "MARK_SEEN_FAILED" });
    }
};


/**
 * [POST] /api/chat/forward
 * Chuyển tiếp (forward) một file/tài liệu từ tin nhắn hiện có đến người dùng khác.
 * 
 * Tất cả user đều có thể forward file mà họ đã nhận hoặc đã gửi.
 * Không cần copy file vật lý - chỉ tạo bản ghi Message mới tham chiếu cùng file_path.
 * 
 * Workflow:
 * 1. Tìm tin nhắn gốc theo messageId.
 * 2. Xác minh người forward có quyền (là sender hoặc receiver của tin nhắn gốc).
 * 3. Tạo Message mới với cùng file_path/material_id, is_forwarded=true.
 * 4. Emit qua socket đến người nhận mới.
 * 
 * Body (JSON):
 * - messageId: ID của tin nhắn gốc cần forward
 * - receiver_id: ID người nhận mới
 */
exports.forwardMessage = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { messageId, receiver_id } = req.body;

        if (!messageId || !receiver_id) {
            return res.status(400).json({ success: false, message: "Thiếu messageId hoặc receiver_id", data: null, errorCode: "MISSING_PARAMS" });
        }

        // --- Tìm tin nhắn gốc ---
        const originalMessage = await Message.findByPk(messageId);

        if (!originalMessage) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tin nhắn gốc", data: null, errorCode: "MESSAGE_NOT_FOUND" });
        }

        // --- Kiểm tra quyền: chỉ sender hoặc receiver của tin nhắn gốc mới được forward ---
        const canForward =
            originalMessage.sender_id === currentUserId ||
            originalMessage.receiver_id === currentUserId;

        if (!canForward) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chuyển tiếp tin nhắn này", data: null, errorCode: "FORWARD_FORBIDDEN" });
        }

        // --- Kiểm tra tin nhắn có file hoặc material không ---
        const hasFile = originalMessage.type === 'file' && originalMessage.file_path;
        const hasMaterial = originalMessage.type === 'material' && originalMessage.material_id;

        if (!hasFile && !hasMaterial) {
            return res.status(400).json({ success: false, message: "Chỉ có thể chuyển tiếp tin nhắn có chứa file hoặc tài liệu", data: null, errorCode: "NOT_FORWARDABLE" });
        }

        // --- Tạo tin nhắn mới (forward) ---
        // Không copy file vật lý - chỉ tham chiếu cùng file_path hoặc material_id
        const forwardedMessage = await Message.create({
            sender_id: currentUserId,
            receiver_id: parseInt(receiver_id),
            content: originalMessage.content, // Giữ nguyên lời nhắn gốc (nếu có)
            type: originalMessage.type,
            material_id: originalMessage.material_id || null,
            file_path: originalMessage.file_path || null,
            file_name: originalMessage.file_name || null,
            file_type: originalMessage.file_type || null,
            is_forwarded: true, // Đánh dấu đây là tin nhắn được forward
            status: 'sent'
        });

        // --- Lấy thông tin người forward ---
        const sender = await User.findByPk(currentUserId, {
            attributes: ['id', 'name']
        });

        const messagePayload = {
            ...forwardedMessage.toJSON(),
            Sender: sender
        };

        // --- Emit qua Socket đến người nhận mới ---
        const io = req.app.get('io');
        const receiverSocketId = onlineUsers.get(parseInt(receiver_id));

        if (receiverSocketId && io) {
            io.to(receiverSocketId).emit('receive_message', messagePayload);

            // Cập nhật status thành delivered vì receiver đang online
            await forwardedMessage.update({ status: 'delivered' });
            messagePayload.status = 'delivered';

            // Thông báo cho sender biết đã delivered
            const senderSocketId = onlineUsers.get(currentUserId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('message_delivered', {
                    messageId: forwardedMessage.id,
                    status: 'delivered'
                });
            }
        }

        res.status(201).json({ success: true, message: "Chuyển tiếp tin nhắn thành công", data: messagePayload, errorCode: null });

    } catch (error) {
        console.error("❌ Forward Message Error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi chuyển tiếp tin nhắn", data: null, errorCode: "FORWARD_MESSAGE_FAILED" });
    }
};
