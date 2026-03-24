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
    const prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ${limit} câu hỏi trắc nghiệm về chủ đề: ${topic}.
Yêu cầu trả về định dạng JSON duy nhất là một mảng:
[
  {
    "question": "Nội dung câu hỏi",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "Đáp án đúng"
  }
]
Chỉ trả về pure JSON array, không markdown, không lời dẫn.`;

    try {
        const text = await generateContent(prompt);
        // Clean markdown backticks if Gemini includes them
        const jsonText = text.replace(/```json\n|\n```|```/g, '').trim();
        const parsedData = JSON.parse(jsonText);
        return Array.isArray(parsedData) ? parsedData : (parsedData.questions || [parsedData]);
    } catch (error) {
        console.error("Lỗi khi parse JSON từ Gemini: ", error.message);
        return [
            {
                question: `Câu hỏi dự phòng về ${topic} (Hệ thống AI đang phản hồi chậm)`,
                options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
                correct_answer: "Đáp án 1"
            }
        ];
    }
};

// QUAN TRỌNG: Export cả 2 để Controller sử dụng
module.exports = {
    generateContent,
    generateQuizFromAI
};