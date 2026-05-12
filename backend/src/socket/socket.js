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

    io.on('connection', (socket) => {
        const userId = Number(socket.user.id);
        console.log(`🟢 User connected: ${userId} (Socket ID: ${socket.id})`);

        // 1. Gia nhập room cá nhân để nhận tin nhắn đa thiết bị
        if (!isNaN(userId)) {
            socket.join(`user_${userId}`);
        }

        // 2. Cập nhật trạng thái online
        if (!isNaN(userId)) {
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
                // Thông báo cho mọi người user này vừa online
                io.emit('user_online', userId);
            }
            onlineUsers.get(userId).add(socket.id);
        }

        // 3. Gửi danh sách user đang online cho người vừa kết nối
        socket.emit('online_users_list', Array.from(onlineUsers.keys()));

        // =========================================================
        // Event: 'send_message'
        // Workflow: Client gửi tin nhắn văn bản → Lưu DB → 
        //           Gửi đến room người nhận → Emit 'receive_message' →
        //           Nếu receiver online, cập nhật status='delivered'
        // =========================================================
        socket.on('send_message', async (data, callback) => {
            try {
                const { receiver_id, content, type, material_id } = data;

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
                    status: 'sent'
                });

                const sender = await User.findByPk(userId, { attributes: ['id', 'name'] });
                let messagePayload = {
                    ...newMessage.toJSON(),
                    Sender: sender
                };

                // --- Kiểm tra người nhận có online không ---
                const isOnline = onlineUsers.has(Number(receiver_id));

                if (isOnline) {
                    // Gửi đến tất cả socket của người nhận qua room
                    io.to(`user_${receiver_id}`).emit('receive_message', messagePayload);

                    await newMessage.update({ status: 'delivered' });
                    messagePayload.status = 'delivered';

                    socket.emit('message_delivered', {
                        messageId: newMessage.id,
                        status: 'delivered'
                    });
                }

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
        // =========================================================
        socket.on('mark_seen', async ({ senderId }) => {
            try {
                if (!senderId) return;
                const { Op } = require('sequelize');

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

                if (updatedCount > 0) {
                    // Thông báo cho tất cả thiết bị của sender qua room
                    io.to(`user_${senderId}`).emit('messages_seen', {
                        by: userId,
                        from: senderId
                    });
                }
            } catch (error) {
                console.error("❌ Mark Seen Socket Error:", error);
            }
        });

        // =========================================================
        // Event: 'disconnect'
        // =========================================================
        socket.on('disconnect', () => {
            console.log(`🔴 User disconnected: ${userId}`);
            
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    // Thông báo cho mọi người user này đã offline
                    io.emit('user_offline', userId);
                }
            }
        });
    });

    return io;
};

module.exports = { initSocket, onlineUsers };
