const { sequelize } = require('../config/database');
const aiService = require('../services/aiService');
const { QueryTypes } = require('sequelize');
const { extractTextFromBuffer, extractTextFromUrl } = require('../services/fileParserService');

/**
 * 1. AI xử lý học liệu: Tóm tắt và Trích xuất từ khóa
 */
exports.processMaterialWithAI = async (req, res) => {
    try {
        const materialId = req.params.id;

        // SỬA: Dùng sequelize.query thay cho db.execute
        const materials = await sequelize.query(
            'SELECT * FROM materials WHERE id = ?',
            { replacements: [materialId], type: QueryTypes.SELECT }
        );
        
        if (materials.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy học liệu này" });
        }

        const material = materials[0];
        
        // Ưu tiên dùng 'content' để AI tóm tắt cho chính xác
        const textToAnalyze = material.content || material.description;

        const prompt = `Bạn là trợ lý giáo dục. Hãy tóm tắt nội dung sau thành 5 gạch đầu dòng và liệt kê 5 từ khóa chính (keywords). 
                        Nội dung: ${textToAnalyze}`;
        
        const aiResult = await aiService.generateContent(prompt);

        // Ghi nhận hành động xem tài liệu
        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, action, progress) VALUES (?, ?, ?, ?)',
            {
                replacements: [req.user.id, materialId, 'VIEWED_MATERIAL', 100],
                type: QueryTypes.INSERT
            }
        );

        res.status(200).json({
            status: 'success',
            material_title: material.title,
            ai_analysis: aiResult 
        });
    } catch (error) {
        console.error("AI Process Error:", error);
        res.status(500).json({ message: "Lỗi xử lý AI hoặc kết nối Database" });
    }
};

/**
 * 1.5 AI Phân tích Nháp (Cho Upload Center)
 */
exports.analyzeDraftMaterial = async (req, res) => {
    try {
        const { source_type, content } = req.body; 
        // source_type có thể là 'file' (content là tên file) hoặc 'link' (content là URL)
        
        const prompt = `Bạn là một trợ lý giáo dục AI. Hãy dựa vào tiêu đề/đường dẫn sau để nội suy và tóm tắt một đoạn giới thiệu học thuật ngắn gọn (tối đa 3 câu) và đưa ra 4 từ khóa quan trọng (tags).
        Thay vì trả lời xin lỗi, hãy đưa ra nội dung giả định phù hợp giáo dục.
        Nội dung phân tích: ${source_type === 'link' ? `Đường dẫn trang web: ${content}` : `Tài liệu: ${content}`}
        
        Vui lòng trả về kết quả theo chuẩn JSON như sau:
        {
           "summary": "Đoạn tóm tắt...",
           "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
        }`;

        let aiResultText = await aiService.generateContent(prompt);
        // Xóa các ký tự markdown JSON thừa nếu có
        aiResultText = aiResultText.replace(/```json\n|\n```|```/g, '').trim();
        
        let parsedResult;
        try {
            parsedResult = JSON.parse(aiResultText);
        } catch(e) {
            // Fallback nếu AI không trả về JSON chuẩn
            parsedResult = {
                summary: "Tài liệu này cung cấp kiến thức nền tảng quan trọng giúp học sinh nắm vững các khái niệm trọng tâm.",
                tags: ["Giáo dục", "Học liệu", "Cơ bản", "Quan trọng"]
            };
        }

        res.status(200).json({
            status: 'success',
            data: parsedResult
        });
    } catch (error) {
        console.error("AI Draft Analyze Error:", error);
        res.status(500).json({ message: "AI hiện không thể phân tích tài liệu này." });
    }
};

/**
 * 2. Tạo học liệu mới
 */
exports.createMaterial = async (req, res) => {
    try {
        const { title, description, content_url, content } = req.body;
        const teacherId = req.user.id; 

        // QUAY LẠI CẤU TRÚC GỐC: Chỉ lưu các trường có sẵn trong database
        const [resultId] = await sequelize.query(
            'INSERT INTO materials (title, description, content_url, content, created_by) VALUES (?, ?, ?, ?, ?)',
                {
                    replacements: [
                        title, 
                        description, 
                        content_url, 
                        content, 
                        teacherId
                    ],
                    type: QueryTypes.INSERT
                }
            );

        res.status(201).json({
            status: 'success',
            message: "Tạo học liệu thành công",
            data: { id: resultId, title }
        });
    } catch (error) {
        console.error("Create Material Error:", error);
        res.status(500).json({ message: "Lỗi khi tạo học liệu", error: error.message });
    }
};

/**
 * 3. Lưu lịch sử học tập (Tracking Progress)
 */
exports.trackProgress = async (req, res) => {
    try {
        const { material_id, quiz_id, action, progress } = req.body;
        const userId = req.user.id; 

        // SỬA: Dùng sequelize.query
        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, quiz_id, action, progress) VALUES (?, ?, ?, ?, ?)',
            {
                replacements: [userId, material_id || null, quiz_id || null, action, progress],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({
            status: 'success',
            message: "Đã ghi nhận tiến độ học tập"
        });
    } catch (error) {
        console.error("Tracking Error:", error);
        res.status(500).json({ message: "Không thể lưu lịch sử học tập" });
    }
};

/**
 * 4. Lấy danh sách học liệu
 */
exports.getAllMaterials = async (req, res) => {
    try {
        // SỬA: JOIN với bảng users để lấy tên người tạo
        const rows = await sequelize.query(
            'SELECT materials.*, users.name as creator_name FROM materials LEFT JOIN users ON materials.created_by = users.id ORDER BY materials.created_at DESC',
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách học liệu" });
    }
};

/**
 * 3.5. Tìm kiếm + Filter học liệu
 * Hỗ trợ:
 * - q: tìm theo tiêu đề hoặc tag (nếu có @/#)
 * - sort: 'latest' | 'oldest' | 'title'
 * - creatorId: lọc theo người tạo
 * - tag: lọc chính xác 1 tag
 */
exports.searchMaterials = async (req, res) => {
    try {
        const { q = '', sort = 'latest', creatorId, tag } = req.query;
        const trimmed = q.trim();

        let queryStr = `
            SELECT materials.*, users.name as creator_name 
            FROM materials 
            LEFT JOIN users ON materials.created_by = users.id 
            WHERE 1=1
        `;
        const replacements = [];

        // 1. Xử lý Search chung (q)
        if (trimmed) {
            const isTagSearch = trimmed.startsWith('@') || trimmed.startsWith('#');
            const keyword = trimmed.replace(/^[@#]/, '').trim();
            
            if (isTagSearch) {
                queryStr += ' AND materials.description LIKE ?';
                replacements.push(`%${keyword}%`);
            } else {
                queryStr += ' AND materials.title LIKE ?';
                replacements.push(`%${keyword}%`);
            }
        }

        // 2. Lọc theo Creator
        if (creatorId) {
            queryStr += ' AND materials.created_by = ?';
            replacements.push(creatorId);
        }

        // 3. Lọc theo Tag cụ thể (nếu FE gửi riêng param tag)
        if (tag) {
            queryStr += ' AND materials.description LIKE ?';
            replacements.push(`%${tag}%`);
        }

        // 4. Sắp xếp
        if (sort === 'oldest') {
            queryStr += ' ORDER BY materials.created_at ASC';
        } else if (sort === 'title') {
            queryStr += ' ORDER BY materials.title ASC';
        } else {
            queryStr += ' ORDER BY materials.created_at DESC';
        }

        const rows = await sequelize.query(queryStr, {
            replacements,
            type: QueryTypes.SELECT
        });

        res.status(200).json({
            status: 'success',
            data: rows,
            meta: {
                query: trimmed,
                sort,
                creatorId,
                tag
            }
        });
    } catch (error) {
        console.error("Search/Filter Error:", error);
        res.status(500).json({ message: "Lỗi khi tìm kiếm hoặc lọc học liệu" });
    }
};

/**
 * 5. Admin: Lấy thống kê hệ thống (Tổng quan)
 */
exports.getSystemStats = async (req, res) => {
    try {
        // Đếm tổng số học liệu, lượt học và người dùng
        const stats = await sequelize.query(`
            SELECT 
                (SELECT COUNT(*) FROM materials) as total_materials,
                (SELECT COUNT(*) FROM learning_history) as total_learning_sessions,
                (SELECT COUNT(*) FROM users WHERE role_id = 1) as total_students,
                (SELECT COUNT(*) FROM users WHERE role_id = 2) as total_teachers
        `, { type: QueryTypes.SELECT });

        res.status(200).json({ status: 'success', data: stats[0] });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy thống kê hệ thống" });
    }
};

/**
 * 6. Admin: Xóa học liệu (Dành cho quản trị viên)
 */
exports.deleteMaterialByAdmin = async (req, res) => {
    try {
        const materialId = req.params.id;
        
        await sequelize.query('DELETE FROM materials WHERE id = ?', {
            replacements: [materialId],
            type: QueryTypes.DELETE
        });

        res.status(200).json({ status: 'success', message: "Admin đã xóa học liệu thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa học liệu" });
    }
};

/**
 * 7. Giao tiếp với AI (Chat) trong Learning View
 */
exports.chatWithAI = async (req, res) => {
    try {
        const { context, question } = req.body;
        
        if (!question) {
            return res.status(400).json({ message: "Vui lòng nhập câu hỏi." });
        }

        const prompt = `Bạn là một gia sư AI tận tâm tên là QuizVibe AI. Dựa vào nội dung tài liệu sau đây, hãy trả lời câu hỏi của học sinh một cách ngắn gọn, súc tích và thân thiện nhất, giống như bạn đang chat trực tiếp.\nHãy dùng tiếng Việt.\n\nNội dung tài liệu:\n${context || 'Không có tài liệu cụ thể.'}\n\nCâu hỏi của học sinh: ${question}`;
        
        const aiResponse = await aiService.generateContent(prompt);

        res.status(200).json({
            status: 'success',
            answer: aiResponse
        });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ message: "AI đang bận, vui lòng thử lại sau." });
    }
};

/**
 * 8. Trích xuất nội dung từ File (TXT, DOCX, PDF) hoặc URL
 */
exports.extractFileContent = async (req, res) => {
    try {
        let extractedText = null;
        let sourceTitle = 'Tài liệu không tên';

        let fileDataForGemini = null;

        if (req.file) {
            const { buffer, mimetype, originalname } = req.file;
            // Sửa lỗi font tiếng Việt khi Multer đọc tên file (latin1 -> utf8)
            const decodedName = Buffer.from(originalname, 'latin1').toString('utf8');
            sourceTitle = decodedName.split('.')[0];
            extractedText = await extractTextFromBuffer(buffer, mimetype, decodedName);

            if (!extractedText) {
                return res.status(415).json({
                    message: `Định dạng file "${originalname}" chưa được hỗ trợ hoặc file rỗng.`
                });
            }

            // [TÍNH NĂNG MỚI] Đính kèm file gốc cho Gemini chạy Native OCR nếu đó là PDF
            // Dung lượng inline_data Gemini max 20MB (base64) nên Buffer giới hạn 15MB an toàn
            if (mimetype === 'application/pdf' && buffer.length < 15 * 1024 * 1024) {
                fileDataForGemini = { buffer, mimeType: mimetype };
            }
        } else if (req.body.url) {
            const { url } = req.body;
            sourceTitle = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
            extractedText = await extractTextFromUrl(url);

            if (!extractedText || extractedText.length < 50) {
                return res.status(422).json({
                    message: 'Không thể trích xuất nội dung từ URL này.'
                });
            }
        } else {
            return res.status(400).json({ message: 'Vui lòng gửi file hoặc URL.' });
        }

        // Gọi AI sinh Draft (summary/tags)
        const draftPrompt = `Bạn là trợ lý giáo dục AI. Hãy viết tóm tắt ngắn (3 câu) và 4 tags cho nội dung tài liệu đính kèm (hoặc text dưới đây nếu không có đính kèm). Trả về đúng JSON {"summary": "...", "tags": ["Tag1", ...]} không kèm markdown.
        Nội dung: ${extractedText.substring(0, 3000)}`;

        let aiDraftText = await aiService.generateContent(draftPrompt, fileDataForGemini);
        aiDraftText = aiDraftText.replace(/```json\n|\n```|```/g, '').trim();
        let parsedDraft;
        try { parsedDraft = JSON.parse(aiDraftText); } catch {
            parsedDraft = { summary: "Tài liệu học thuật quan trọng.", tags: ["Học liệu", "Cơ bản"] };
        }

        // Gọi AI tạo Bài giảng đầy đủ. Kèm file PDF gốc (native OCR) nếu có!
        const lessonPrompt = `Bạn là giáo viên. Viết bài giảng chi tiết (3 phần lớn ##) dựa trên tài liệu PDF đính kèm (ưu tiên đọc PDF nếu có) hoặc đoạn nội dung text sau về chủ đề ${sourceTitle}.
        Nội dung tài liệu: ${extractedText.substring(0, 5000)}`;

        const lessonContent = await aiService.generateContent(lessonPrompt, fileDataForGemini);

        return res.status(200).json({
            status: 'success',
            data: {
                title: sourceTitle,
                summary: parsedDraft.summary,
                tags: parsedDraft.tags,
                lessonContent
            }
        });
    } catch (error) {
        console.error('Extract Error:', error);
        res.status(500).json({ message: 'Lỗi khi xử lý tài liệu.' });
    }
};

/**
 * 9. Lấy tiến độ học tập đã lưu của người dùng
 */
exports.getMaterialProgress = async (req, res) => {
    try {
        const { material_id } = req.params;
        const userId = req.user.id;

        const results = await sequelize.query(
            'SELECT MAX(progress) as max_progress FROM learning_history WHERE user_id = ? AND material_id = ? AND action = "VIEWED_MATERIAL"',
            { replacements: [userId, material_id], type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 'success',
            progress: results[0]?.max_progress || 0
        });
    } catch (error) {
        console.error('Get Progress Error:', error);
        res.status(500).json({ message: 'Không thể tải tiến độ học tập.' });
    }
};

/**
 * 10. Lấy dữ liệu Dashboard cho trang Home
 */
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const roleId = req.user.role_id;

        // Nếu là Giáo viên (2) hoặc Admin (3)
        if (roleId === 2 || roleId === 3) {
            // 1. Tổng số học liệu đã tạo
            const matResult = await sequelize.query(
                'SELECT COUNT(*) as count FROM materials WHERE created_by = ?',
                { replacements: [userId], type: QueryTypes.SELECT }
            );

            // 2. Tổng số bài quiz đã tạo
            const quizResult = await sequelize.query(
                'SELECT COUNT(*) as count FROM quizzes WHERE created_by = ?',
                { replacements: [userId], type: QueryTypes.SELECT }
            );

            // 3. Tổng lượt tương tác trên các nội dung mình tạo (VIEWED/STARTED/COMPLETED)
            const interactResult = await sequelize.query(
                `SELECT COUNT(lh.id) as count 
                 FROM learning_history lh
                 LEFT JOIN materials m ON lh.material_id = m.id
                 LEFT JOIN quizzes q ON lh.quiz_id = q.id
                 WHERE m.created_by = ? OR q.created_by = ?`,
                { replacements: [userId, userId], type: QueryTypes.SELECT }
            );

            return res.status(200).json({
                status: 'success',
                data: {
                    stats: {
                        totalMaterials: matResult[0]?.count || 0,
                        totalQuizzes: quizResult[0]?.count || 0,
                        totalInteractions: interactResult[0]?.count || 0
                    }
                }
            });
        }

        // Nếu là Sinh viên (1)
        // 1. Lấy bài học đang xem dở bài gần nhất
        const lastMaterials = await sequelize.query(
            `SELECT m.id, m.title, m.description, lh.progress, lh.created_at 
             FROM learning_history lh
             JOIN materials m ON lh.material_id = m.id
             WHERE lh.user_id = ? AND lh.action = 'VIEWED_MATERIAL'
             ORDER BY lh.created_at DESC LIMIT 1`,
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        // 2. Thống kê bài đã học (đếm material_id duy nhất)
        const statsResult = await sequelize.query(
            `SELECT COUNT(DISTINCT material_id) as total_learned 
             FROM learning_history 
             WHERE user_id = ? AND (action = 'VIEWED_MATERIAL' OR action = 'COMPLETED_QUIZ')`,
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        // 3. Tính điểm trung bình (AVG score)
        const avgScoreResult = await sequelize.query(
            'SELECT AVG(score) as avg_score FROM results WHERE user_id = ?',
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 'success',
            data: {
                lastMaterial: lastMaterials[0] || null,
                stats: {
                    totalLearned: statsResult[0]?.total_learned || 0,
                    avgScore: avgScoreResult[0]?.avg_score ? parseFloat(avgScoreResult[0].avg_score).toFixed(1) : 0
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Không thể tải dữ liệu Dashboard.' });
    }
};