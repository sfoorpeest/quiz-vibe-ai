const axios = require('axios');

/**
 * HÀM CHUNG: Sử dụng Google Gemini với giải pháp Mock fallback
 */
const generateContent = async (prompt, fileData = null) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        let parts = [{ text: prompt }];
        if (fileData && fileData.buffer && fileData.mimeType) {
            parts.push({
                inline_data: {
                    mime_type: fileData.mimeType,
                    data: fileData.buffer.toString('base64')
                }
            });
        }

        const response = await axios.post(url, {
            contents: [{ parts }]
        });

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
            return response.data.candidates[0].content.parts[0].text;
        }
        throw new Error("Invalid response from Gemini API");
    } catch (error) {
        const errorDetail = error.response?.data || error.message;
        console.error("❌ Gemini API Error:", JSON.stringify(errorDetail, null, 2));
        
        // Return a raw error message so the calling controller knows it failed
        throw new Error(`AI_GEN_FAILED: ${error.message}`);
    }
};

/**
 * HÀM RIÊNG: Tạo Quiz từ AI
 */
const generateQuizFromAI = async (topic, limit = 5) => {
    const prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ${limit} câu hỏi trắc nghiệm tiếng Việt dựa trên nội dung sau:
    ---
    ${topic}
    ---
    YÊU CẦU BẮT BUỘC:
    1. Chỉ trả về duy nhất một mảng JSON (không có văn bản giải thích ở đầu hay cuối).
    2. Mỗi phần tử trong mảng phải có cấu trúc: {"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "...", "explanation": "..."}.
    3. 'correct_answer' phải trùng khớp hoàn toàn với một trong các phần tử trong 'options'.
    4. 'explanation' là lời giải chi tiết (khoảng 1-2 câu ngắn gọn) giải thích tại sao đáp án lại đúng dựa trên nội dung tài liệu.
    5. Không dùng markdown code block (như \`\`\`json).`;

    try {
        const text = await generateContent(prompt);
        // Làm sạch dữ liệu nếu AI lỡ tay thêm markdown hoặc text thừa
        const jsonMatch = text.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("AI không trả về định dạng mảng JSON mong muốn.");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Quiz Parse Error or AI Error:", error.message);
        // Trả về Quiz mẫu cực đẹp để test giao diện
        const mockQuestions = [];
        for (let i = 1; i <= limit; i++) {
            mockQuestions.push({
                question: `Câu hỏi trắc nghiệm số ${i} về nội dung này? (Mẫu)`,
                options: ["Đáp án A (Đúng mẫu)", "Đáp án B", "Đáp án C", "Đáp án D"],
                correct_answer: "Đáp án A (Đúng mẫu)",
                explanation: "Đây là lời giải mẫu được tạo tự động để kiểm thử giao diện vì AI đang bận."
            });
        }
        return mockQuestions;
    }
};

module.exports = {
    generateContent,
    generateQuizFromAI
};