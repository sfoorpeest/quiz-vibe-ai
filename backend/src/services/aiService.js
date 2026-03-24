const axios = require('axios');

exports.generateQuizFromAI = async (topic, limit = 5) => {
    try {
        // SỬ DỤNG MODEL THÀNH CÔNG NHẤT TỪ FILE TEST: gemini-2.5-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const prompt = `Bạn là một chuyên gia giáo dục. 
        Hãy tạo ${limit} câu hỏi trắc nghiệm về chủ đề: ${topic}.
        Yêu cầu trả về định dạng JSON duy nhất là một mảng các đối tượng:
        [
          {
            "question": "Nội dung câu hỏi",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "Nội dung của đáp án đúng"
          }
        ]
        Chỉ trả về JSON thuần túy, không kèm lời dẫn hay markdown.`;

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
<<<<<<< HEAD

=======
        
>>>>>>> main
        // Parse JSON (Gemini 2.5 thường trả về JSON sạch, nhưng ta vẫn dùng try-catch cho chắc)
        const parsedData = JSON.parse(text);

        return Array.isArray(parsedData) ? parsedData : (parsedData.questions || [parsedData]);

    } catch (error) {
        console.error("❌ Gemini 2.5 API Error:", error.response?.data || error.message);
<<<<<<< HEAD

=======
        
>>>>>>> main
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