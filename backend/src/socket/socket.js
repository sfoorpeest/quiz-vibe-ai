const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Socket.IO: Khởi tạo và quản lý real-time chat
 * 
 * Sử dụng Map để lưu trữ danh sách user đang online:
 * Key: userId (number), Value: socket.id (string)
 * 
 * Các sự kiện được xử lý:
 * Client → Server:
 *   - 'send_message'  : Gửi tin nhắn văn bản
 *   - 'mark_seen'     : Đánh dấu đã xem tất cả tin nhắn từ một sender
 * 
 * Server → Client:
 *   - 'receive_message'  : Gửi tin nhắn đến người nhận
 *   - 'message_delivered': Thông báo cho sender khi tin nhắn được delivered
 *   - 'messages_seen'    : Thông báo cho sender khi tin nhắn được xem
 */
const onlineUsers = new Map();

const initSocket = (server) => {
    // --- Khởi tạo Socket.IO server ---
    const io = socketIo(server, {
        cors: {
            origin: "*", // Cấu hình origin phù hợp với môi trường thực tế
            methods: ["GET", "POST"]
        }
    });

    // --- Middleware xác thực kết nối Socket.IO ---
    // Workflow: Kiểm tra JWT token trước khi cho phép kết nối
    // Client phải gửi token dưới dạng: { auth: { token: '...' } }
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Giải mã JWT và gắn thông tin user vào socket
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // --- Xử lý khi có client kết nối thành công ---
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`🟢 User connected: ${userId} (Socket ID: ${socket.id})`);

        // 1. Thêm user vào danh sách online
        onlineUsers.set(userId, socket.id);

        // =========================================================
        // Event: 'send_message'
        // Workflow: Client gửi tin nhắn văn bản → Lưu DB → 
        //           Tìm socket receiver → Emit 'receive_message' →
        //           Nếu receiver online, cập nhật status='delivered'
        // =========================================================
        socket.on('send_message', async (data, callback) => {
            try {
                const { receiver_id, content, type, material_id } = data;

                // Validate dữ liệu đầu vào
                if (!receiver_id) {
                    if (typeof callback === 'function') callback({ success: false, error: 'Thiếu receiver_id' });
                    return;
                }

                // --- Lưu tin nhắn vào Database ---
                const newMessage = await Message.create({
                    sender_id: userId,
                    receiver_id,
                    content,
                    type: type || 'text',
                    material_id: material_id || null,
                    status: 'sent' // Trạng thái ban đầu
                });

                // --- Lấy thông tin người gửi để đính kèm vào payload ---
                const sender = await User.findByPk(userId, { attributes: ['id', 'name'] });

                let messagePayload = {
                    ...newMessage.toJSON(),
                    Sender: sender
                };

                // --- Kiểm tra người nhận có online không ---
                const receiverSocketId = onlineUsers.get(Number(receiver_id));

                if (receiverSocketId) {
                    // Receiver đang online → gửi tin nhắn đến họ
                    io.to(receiverSocketId).emit('receive_message', messagePayload);

                    // Cập nhật status thành 'delivered' trong DB
                    await newMessage.update({ status: 'delivered' });
                    messagePayload.status = 'delivered';

                    // Thông báo cho sender biết tin nhắn đã được delivered
                    // Sender sẽ cập nhật icon từ ✓ (sent) → ✓✓ (delivered)
                    socket.emit('message_delivered', {
                        messageId: newMessage.id,
                        status: 'delivered'
                    });
                }

                // --- Trả về kết quả cho sender (để FE cập nhật UI ngay) ---
                if (typeof callback === 'function') {
                    callback({ success: true, message: messagePayload });
                }

            } catch (error) {
                console.error("❌ Send Message Error:", error);
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'Lỗi server khi gửi tin nhắn' });
                }
            }
        });

        // =========================================================
        // Event: 'mark_seen'
        // Khi user mở một cuộc trò chuyện, client emit event này
        // để đánh dấu tất cả tin nhắn từ senderId là 'seen'.
        // 
        // Workflow: Client emit → Update DB → Emit 'messages_seen' 
        //           đến sender để FE cập nhật icon tick thành màu xanh
        // =========================================================
        socket.on('mark_seen', async ({ senderId }) => {
            try {
                if (!senderId) return;

                const { Op } = require('sequelize');

                // Cập nhật tất cả tin nhắn chưa seen từ senderId → userId
                const [updatedCount] = await Message.update(
                    { status: 'seen' },
                    {
                        where: {
                            sender_id: senderId,
                            receiver_id: userId,
                            status: { [Op.ne]: 'seen' }
                        }
                    }
                );

                // Nếu có tin nhắn được cập nhật, thông báo cho sender
                if (updatedCount > 0) {
                    const senderSocketId = onlineUsers.get(Number(senderId));
                    if (senderSocketId) {
                        // Sender sẽ cập nhật icon từ ✓✓ (delivered) → ✓✓ xanh (seen)
                        io.to(senderSocketId).emit('messages_seen', {
                            by: userId,       // userId đã xem
                            from: senderId    // tin nhắn của senderId được xem
                        });
                    }
                }
            } catch (error) {
                console.error("❌ Mark Seen Socket Error:", error);
            }
        });

        // =========================================================
        // Event: 'disconnect'
        // Xử lý khi user ngắt kết nối (đóng tab, mất mạng)
        // =========================================================
        socket.on('disconnect', () => {
            console.log(`🔴 User disconnected: ${userId}`);
            onlineUsers.delete(userId);
        });
    });

    return io;
};

module.exports = { initSocket, onlineUsers };
