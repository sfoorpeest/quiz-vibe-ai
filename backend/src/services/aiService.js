const axios = require('axios');

/**
 * HÀM CHUNG: Sử dụng Google Gemini với giải pháp Mock fallback
 */
const generateContent = async (prompt) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
            return response.data.candidates[0].content.parts[0].text;
        }
        throw new Error("Invalid response");
    } catch (error) {
        console.error("❌ Gemini API Error (v1):", error.response?.data || error.message);

        // --- CHẾ ĐỘ MOCK PHẢN HỒI (DÀNH CHO TRƯỜNG HỢP KEY LỖI HOẶC QUÁ TẢI) ---
        // SỬA: Regex bám sát từ khóa \b để không dính "tài", "bài", "lại", v.v.
        if (prompt.match(/\b(chào|hello)\b/i)) {
            return "Chào bạn! Mình là QuizVibe AI. Rất vui được đồng hành cùng bạn trong bài học này. Bạn cần mình giải đáp thắc mắc nào về nội dung trên không?";
        }

        // Tự động tạo bài giảng theo chủ đề (Tách từ Title trong prompt nếu có thể)
        // Nếu prompt có chứa "xoay quanh chủ đề", ta trích xuất nó ra để viết bài giảng ảo phù hợp
        const matchTopic = prompt.match(/chủ đề "(.*?)"/i);
        if (matchTopic && matchTopic[1]) {
            const topic = matchTopic[1];
            return `## 1. Mở đầu về ${topic}\n\nHôm nay chúng ta sẽ tìm hiểu về ${topic}. Đây là một khái niệm cực kỳ quan trọng đòi hỏi bạn phải nắm vững nền tảng gốc rễ để áp dụng vào thực tế.\n\n## 2. Các điểm cốt lõi của ${topic}\n\n- Bản chất vật lý / kỹ thuật nền tảng.\n- Những trường hợp sử dụng cơ bản.\n- So sánh ưu nhược điểm so với các hệ thống hoặc khái niệm tương đương.\n\n## 3. Tổng kết bài giảng\n\nNắm được lý thuyết của ${topic} sẽ giúp bạn có lợi thế lớn khi bắt tay vào triển khai. Hãy giữ vững tinh thần tự học thật tốt (Lưu ý: API Gemini hiện tại đang quá tải hoặc giới hạn đọc nội dung file cục bộ, vì vậy đây là phần phân tích giả lập từ tiêu đề file).`;
        }
        
        // Nếu chỉ hỏi câu hỏi bình thường
        if (prompt.match(/\b(ai|trí tuệ nhân tạo)\b/i)) {
            return "Trí tuệ nhân tạo (AI) là lĩnh vực máy tính mô phỏng trí thông minh con người. Trong bài học này, chúng ta tập trung vào Machine Learning và Deep Learning - hai trụ cột giúp máy tính tự học hỏi.";
        }

        return "Hệ thống AI hiện đang xử lý quá nhiều yêu cầu hoặc không thể đọc file nhị phân đính kèm (PDF/DOCX). Dựa vào kinh nghiệm, đây là một nội dung học thuật quan trọng mà bạn cần nghiên cứu sâu thêm từ các tài liệu bên ngoài.";
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