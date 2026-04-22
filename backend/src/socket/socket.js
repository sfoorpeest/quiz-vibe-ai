const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

// Sử dụng Map để lưu trữ danh sách user đang online
// Key: userId, Value: socket.id
// Workflow: Khi user kết nối, ta lưu socket.id của họ. Khi cần gửi tin nhắn cho user đó, ta lấy socket.id từ Map này.
const onlineUsers = new Map();

const initSocket = (server) => {
    // Khởi tạo Socket.IO server với cấu hình CORS cho phép Frontend kết nối
    const io = socketIo(server, {
        cors: {
            origin: "*", // Cấu hình origin phù hợp với môi trường thực tế (vd: 'http://localhost:3000')
            methods: ["GET", "POST"]
        }
    });

    // Middleware xác thực kết nối Socket.IO
    // Workflow: Trước khi cho phép kết nối thành công, kiểm tra token JWT gửi lên từ client.
    // Nếu token hợp lệ, lưu thông tin user vào socket object và cho phép kết nối.
    io.use((socket, next) => {
        try {
            // Lấy token từ handshake auth (client phải gửi dưới dạng { auth: { token: '...' } })
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Gắn thông tin user vào socket để sử dụng ở các sự kiện sau
            socket.user = decoded;
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Lắng nghe sự kiện khi có client kết nối thành công
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`🟢 User connected: ${userId} (Socket ID: ${socket.id})`);

        // 1. Thêm user vào danh sách online
        onlineUsers.set(userId, socket.id);
        
        // Cập nhật trạng thái online cho mọi người (nếu cần thiết)
        // io.emit('user_status_change', { userId, status: 'online' });

        // 2. Lắng nghe sự kiện gửi tin nhắn từ client
        // Workflow: Nhận tin nhắn -> Lưu vào DB -> Tìm socket.id của người nhận -> Gửi qua socket cho người nhận (nếu online)
        socket.on('send_message', async (data, callback) => {
            try {
                const { receiver_id, content, type, material_id } = data;

                // Validate dữ liệu cơ bản
                if (!receiver_id) {
                    if (typeof callback === 'function') callback({ success: false, error: 'Thiếu receiver_id' });
                    return;
                }

                // Lưu tin nhắn vào Database
                const newMessage = await Message.create({
                    sender_id: userId,
                    receiver_id,
                    content,
                    type: type || 'text',
                    material_id: material_id || null
                });

                // Lấy thông tin người gửi để đính kèm vào tin nhắn trả về
                const sender = await User.findByPk(userId, { attributes: ['id', 'name'] });

                const messagePayload = {
                    ...newMessage.toJSON(),
                    Sender: sender
                };

                // Trả về kết quả thành công cho người gửi (để client cập nhật UI)
                if (typeof callback === 'function') {
                    callback({ success: true, message: messagePayload });
                }

                // Gửi tin nhắn đến người nhận nếu họ đang online
                const receiverSocketId = onlineUsers.get(Number(receiver_id));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', messagePayload);
                }
            } catch (error) {
                console.error("❌ Send Message Error:", error);
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'Lỗi server khi gửi tin nhắn' });
                }
            }
        });

        // 3. Xử lý khi user ngắt kết nối
        // Workflow: Khi client đóng tab hoặc mất mạng, sự kiện disconnect được gọi. Ta xóa user khỏi Map online.
        socket.on('disconnect', () => {
            console.log(`🔴 User disconnected: ${userId}`);
            onlineUsers.delete(userId);
            
            // io.emit('user_status_change', { userId, status: 'offline' });
        });
    });

    return io;
};

module.exports = { initSocket, onlineUsers };
