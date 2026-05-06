import axiosClient from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

/**
 * Service: chatService
 * 
 * Tập hợp tất cả các hàm giao tiếp với Chat API.
 * Mỗi hàm wrap một request HTTP và xử lý response/error.
 */


/**
 * Lấy danh sách những người dùng đã từng nhắn tin (danh bạ).
 * @returns {Promise<Array>} Danh sách người dùng với id, name, email, role_id
 */
export const getContacts = async () => {
    try {
        const response = await axiosClient.get('/api/chat/contacts');
        return unwrapData(response, 'Get contacts');
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};


/**
 * Lấy lịch sử nhắn tin với một người dùng cụ thể.
 * @param {string|number} userId - ID của người đang chat cùng
 * @returns {Promise<Array>} Danh sách tin nhắn, đã sắp xếp theo thời gian tăng dần
 */
export const getChatHistory = async (userId) => {
    try {
        const response = await axiosClient.get(`/api/chat/history/${userId}`);
        return unwrapData(response, 'Get chat history');
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};


/**
 * Tìm kiếm người dùng trong hệ thống.
 * @param {string} query - Từ khóa tìm kiếm (tên hoặc email)
 * @returns {Promise<Array>} Danh sách kết quả tìm kiếm
 */
export const searchUsers = async (query) => {
    try {
        const response = await axiosClient.get(`/api/chat/search?q=${encodeURIComponent(query)}`);
        return unwrapData(response, 'Search users');
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};


/**
 * Upload một file (PDF/DOCX/TXT) và gửi như một tin nhắn trong chat.
 * Chỉ Giáo viên và Admin có quyền upload.
 * 
 * @param {FormData} formData - FormData chứa:
 *   - 'file': File object
 *   - 'receiver_id': ID người nhận
 *   - 'content': (optional) Lời nhắn kèm file
 * @returns {Promise<Object>} Message object vừa được tạo
 */
export const uploadFileMessage = async (formData) => {
    try {
        const response = await axiosClient.post('/api/chat/upload', formData, {
            // Để browser tự set Content-Type với boundary khi upload multipart/form-data
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return unwrapData(response, 'Upload file message');
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};


/**
 * Chuyển tiếp (forward) một file từ tin nhắn có sẵn đến người dùng khác.
 * Tất cả user đều có thể forward file mà họ đã nhận hoặc đã gửi.
 * 
 * @param {number} messageId - ID của tin nhắn gốc cần forward
 * @param {number} receiverId - ID người nhận mới
 * @returns {Promise<Object>} Message object mới (bản forward)
 */
export const forwardMessage = async (messageId, receiverId) => {
    try {
        const response = await axiosClient.post('/api/chat/forward', {
            messageId,
            receiver_id: receiverId
        });
        return unwrapData(response, 'Forward message');
    } catch (error) {
        console.error('Error forwarding message:', error);
        throw error;
    }
};


/**
 * Đánh dấu tất cả tin nhắn từ senderId đến mình là 'seen'.
 * Gọi khi người dùng mở một cuộc trò chuyện.
 * 
 * @param {number} senderId - ID người gửi mà tin nhắn của họ cần được đánh dấu đã xem
 * @returns {Promise<void>}
 */
export const markMessagesSeen = async (senderId) => {
    try {
        await axiosClient.put(`/api/chat/seen/${senderId}`);
    } catch (error) {
        // Không throw error vì đây là tính năng phụ, không ảnh hưởng UX chính
        console.error('Error marking messages as seen:', error);
    }
};
