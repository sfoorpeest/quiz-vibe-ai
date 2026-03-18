const axios = require('axios');

exports.generateQuizFromAI = async (topic, limit = 5) => {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "Bạn là chuyên gia giáo dục. Chỉ trả về dữ liệu định dạng JSON duy nhất. Cấu trúc: {\"questions\": [{\"question\": \"...\", \"options\": [\"...\"], \"correct_answer\": \"...\"}]}"
                },
                {
                    role: "user",
                    content: `Tạo ${limit} câu hỏi trắc nghiệm về: ${topic}`
                }
            ],
            // Thêm các tham số tối ưu hóa
            response_format: { type: 'json_object' },
            max_tokens: 2000, 
            temperature: 0.7 
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = JSON.parse(response.data.choices[0].message.content);
        return content.questions;
    } catch (error) {
        // Log chi tiết lỗi để bạn dễ theo dõi
        if (error.response && error.response.data) {
            console.error("DeepSeek API Detail:", error.response.data);
        }
        throw new Error("Lỗi kết nối DeepSeek: " + (error.response?.data?.error?.message || error.message));
    }
};