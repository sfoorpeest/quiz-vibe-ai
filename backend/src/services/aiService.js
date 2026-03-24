const axios = require('axios');

// HÀM CHUNG: Dùng để gửi Prompt bất kỳ cho Gemini (Tóm tắt, dịch, phân tích...)
const generateContent = async (prompt) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                // Model 2.5 hỗ trợ cực tốt việc ép kiểu JSON
                response_mime_type: "application/json",
                temperature: 0.7
            }
        });

        // Trích xuất text từ response của Gemini 2.5
        const text = response.data.candidates[0].content.parts[0].text;

        // Parse JSON (Gemini 2.5 thường trả về JSON sạch, nhưng ta vẫn dùng try-catch cho chắc)
        const parsedData = JSON.parse(text);

        return Array.isArray(parsedData) ? parsedData : (parsedData.questions || [parsedData]);

    } catch (error) {
        console.error("❌ Gemini 2.5 API Error:", error.response?.data || error.message);

        // Fallback (Dữ liệu dự phòng)
        return [
            {
                question: `Câu hỏi dự phòng về ${topic} (Hệ thống AI đang phản hồi chậm)`,
                options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
                correct_answer: "Đáp án 1"
            }
        ];
    }
};