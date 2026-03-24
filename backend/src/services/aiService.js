const axios = require('axios');

// HÀM CHUNG: Dùng để gửi Prompt bất kỳ cho Gemini (Tóm tắt, dịch, phân tích...)
const generateContent = async (prompt) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        // SỬA DÒNG NÀY ĐỂ XEM LỖI THẬT
        console.error("❌ Gemini API Detail Error:", error.response?.data || error.message);
        return "Không thể xử lý nội dung lúc này.";
    }
};

// HÀM RIÊNG: Dùng để tạo Quiz (giữ nguyên logic của bạn nhưng dùng hàm chung ở trên)
const generateQuizFromAI = async (topic, limit = 5) => {
    const prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ${limit} câu hỏi trắc nghiệm về chủ đề: ${topic}... (giữ nguyên phần prompt cũ của bạn)`;
    // ... logic parse JSON của bạn ...
};

// QUAN TRỌNG: Export cả 2 để Controller sử dụng
module.exports = {
    generateContent,
    generateQuizFromAI
};