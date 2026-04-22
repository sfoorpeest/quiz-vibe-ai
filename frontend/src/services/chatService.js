import axiosClient from '../api/axiosClient';

/**
 * Lấy danh sách những người dùng có thể chat (danh bạ)
 * @returns {Promise<Array>} Danh sách người dùng
 */
export const getContacts = async () => {
    try {
        const response = await axiosClient.get('/api/chat/contacts');
        // Backend trả về: { success: true, data: [...] }
        return response.data.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};

/**
 * Lấy lịch sử nhắn tin với một người dùng cụ thể
 * @param {string|number} userId ID của người đang chat cùng
 * @returns {Promise<Array>} Danh sách tin nhắn
 */
export const getChatHistory = async (userId) => {
    try {
        const response = await axiosClient.get(`/api/chat/history/${userId}`);
        // Backend trả về: { success: true, data: [...] }
        return response.data.data;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};

/**
 * Tìm kiếm người dùng trong hệ thống
 * @param {string} query Từ khóa tìm kiếm
 * @returns {Promise<Array>} Danh sách kết quả tìm kiếm
 */
export const searchUsers = async (query) => {
    try {
        const response = await axiosClient.get(`/api/chat/search?q=${encodeURIComponent(query)}`);
        return response.data.data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};
