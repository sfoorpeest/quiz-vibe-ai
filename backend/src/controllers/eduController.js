const { sequelize } = require('../config/database');
const aiService = require('../services/aiService');
const { QueryTypes } = require('sequelize');
const { extractTextFromBuffer, extractTextFromUrl } = require('../services/fileParserService');
const { getMaterialLearningSnapshot } = require('../services/materialService');

/**
 * 1. AI xử lý học liệu: Tóm tắt và Trích xuất từ khóa từ học liệu có sẵn
 */
exports.processMaterialWithAI = async (req, res) => {
    try {
        const materialId = req.params.id;

        // Truy vấn thông tin học liệu
        const materials = await sequelize.query(
            'SELECT * FROM materials WHERE id = ?',
            { replacements: [materialId], type: QueryTypes.SELECT }
        );
        
        if (materials.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy học liệu này" });
        }

        const material = materials[0];
        
        // Ưu tiên dùng 'content' (nội dung chi tiết) để AI tóm tắt chính xác hơn description
        const textToAnalyze = material.content || material.description;

        const prompt = `Bạn là trợ lý giáo dục. Hãy tóm tắt nội dung sau thành 5 gạch đầu dòng và liệt kê 5 từ khóa chính (keywords). 
                        Nội dung: ${textToAnalyze}`;
        
        const aiResult = await aiService.generateContent(prompt);

        // Ghi lại lịch sử là người dùng đã xem tài liệu này (đọc hết bài = 90%)
        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, action, progress) VALUES (?, ?, ?, ?)',
            {
                replacements: [req.user.id, materialId, 'VIEWED_MATERIAL', 90],
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
 * 1.5 AI Phân tích Nháp: Dự đoán nội dung khi người dùng mới dán Link hoặc chọn File
 */
exports.analyzeDraftMaterial = async (req, res) => {
    try {
        const { source_type, content } = req.body; 
        
        const prompt = `Bạn là một trợ lý giáo dục AI. Hãy dựa vào tiêu đề/đường dẫn sau để nội suy và tóm tắt một đoạn giới thiệu học thuật ngắn gọn (tối đa 3 câu) và đưa ra 4 từ khóa quan trọng (tags).
        Thay vì trả lời xin lỗi, hãy đưa ra nội dung giả định phù hợp giáo dục.
        Nội dung phân tích: ${source_type === 'link' ? `Đường dẫn trang web: ${content}` : `Tài liệu: ${content}`}
        
        Vui lòng trả về kết quả theo chuẩn JSON như sau:
        {
           "summary": "Đoạn tóm tắt...",
           "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
        }`;

        let aiResultText = await aiService.generateContent(prompt);
        // Clean markdown code blocks nếu AI trả về
        aiResultText = aiResultText.replace(/```json\n|\n```|```/g, '').trim();
        
        let parsedResult;
        try {
            parsedResult = JSON.parse(aiResultText);
        } catch(e) {
            // Fallback nếu JSON parse lỗi
            parsedResult = {
                summary: "Tài liệu này cung cấp kiến thức nền tảng quan trọng giúp học sinh nắm vững các khái niệm trọng tâm.",
                tags: ["Giáo dục", "Học liệu", "Cơ bản", "Quan trọng"]
            };
        }

        res.status(200).json({ status: 'success', data: parsedResult });
    } catch (error) {
        console.error("AI Draft Analyze Error:", error);
        res.status(500).json({ message: "AI hiện không thể phân tích tài liệu này." });
    }
};

/**
 * 2. Lưu học liệu mới vào Database và Đồng bộ lại toàn bộ file JSON
 * Cập nhật: Thêm thuộc tính visibility (Quyền riêng tư)
 */
const fs = require('fs');
const path = require('path');

exports.createMaterial = async (req, res) => {
    try {
        const { title, description, content_url, content, visibility = 'public' } = req.body;
        const teacherId = req.user.id; 

        // 1. Lưu bản ghi mới vào Database (MySQL) kèm trạng thái hiển thị
        let tagsToSave = null;
        if (req.body.tags) {
            tagsToSave = Array.isArray(req.body.tags) ? req.body.tags.join(',') : req.body.tags;
        }

        const [resultId] = await sequelize.query(
            'INSERT INTO materials (title, description, content_url, content, created_by, visibility, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
            {
                replacements: [title, description, content_url, content, teacherId, visibility, tagsToSave],
                type: QueryTypes.INSERT
            }
        );

        // 2. [CẬP NHẬT] ĐỒNG BỘ TOÀN DIỆN: Lấy toàn bộ dữ liệu từ DB để ghi đè vào file JSON
        // Cách này đảm bảo ID 3, ID 4 và các ID cũ đều sẽ xuất hiện đầy đủ trong file
        const jsonPath = path.join(__dirname, '../database/data/materials.json'); 
        
        // Truy vấn tất cả học liệu đang có trong DB
        const allMaterials = await sequelize.query(
            'SELECT * FROM materials ORDER BY id ASC',
            { type: QueryTypes.SELECT }
        );

        // Chuyển đổi định dạng dữ liệu (Mapping) nếu cần thiết để khớp với cấu trúc JSON mong muốn
        const formattedData = allMaterials.map(item => ({
            id: item.id,
            teacher_id: item.created_by, // Map lại created_by thành teacher_id cho đúng format cũ
            title: item.title,
            description: item.description,
            file_path: item.content_url,
            content: item.content,
            visibility: item.visibility,
            created_at: item.created_at,
            tags: item.tags,
            _status: "Synced from Database"
        }));

        // Ghi đè toàn bộ nội dung mới vào file materials.json
        fs.writeFileSync(jsonPath, JSON.stringify(formattedData, null, 4), 'utf8');

        res.status(201).json({
            status: 'success',
            message: "Tạo học liệu thành công và đã đồng bộ toàn bộ file JSON",
            data: { id: resultId, title }
        });

    } catch (error) {
        console.error("Create Material Sync Error:", error);
        res.status(500).json({ 
            message: "Lỗi khi tạo học liệu hoặc lỗi đồng bộ file hệ thống", 
            error: error.message 
        });
    }
};

exports.updateMaterialVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { visibility } = req.body;
        const userId = req.user.id;

        if (!['public', 'private'].includes(visibility)) {
            return res.status(400).json({ message: "Visibility không hợp lệ" });
        }

        // Cập nhật DB
        const [result] = await sequelize.query(
            'UPDATE materials SET visibility = ? WHERE id = ? AND created_by = ?',
            { replacements: [visibility, id, userId], type: QueryTypes.UPDATE }
        );

        // Cập nhật file JSON
        const jsonPath = path.join(__dirname, '../database/data/materials.json');
        const allMaterials = await sequelize.query('SELECT * FROM materials ORDER BY id ASC', { type: QueryTypes.SELECT });
        const formattedData = allMaterials.map(item => ({
            id: item.id,
            teacher_id: item.created_by,
            title: item.title,
            description: item.description,
            file_path: item.content_url,
            content: item.content,
            visibility: item.visibility,
            created_at: item.created_at,
            tags: item.tags,
            _status: "Synced from Database"
        }));
        fs.writeFileSync(jsonPath, JSON.stringify(formattedData, null, 4), 'utf8');

        res.status(200).json({ status: 'success', message: "Cập nhật quyền riêng tư thành công" });
    } catch (error) {
        console.error("Update Visibility Error:", error);
        res.status(500).json({ message: "Lỗi cập nhật quyền riêng tư" });
    }
};

/**
 * 2.5 Lấy danh sách Giáo viên và Chia sẻ tài liệu cho Giáo viên
 */
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await sequelize.query(
            'SELECT id, name, email FROM users WHERE role_id IN (2, 3)',
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: teachers });
    } catch (error) {
        console.error("Get Teachers Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách giáo viên" });
    }
};

exports.shareMaterialToTeachers = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherIds } = req.body;
        const userId = req.user.id;

        // Xác nhận quyền sở hữu
        const [materials] = await sequelize.query(
            'SELECT id FROM materials WHERE id = ? AND created_by = ?',
            { replacements: [id, userId], type: QueryTypes.SELECT }
        );

        if (!materials) {
            return res.status(403).json({ message: "Bạn không có quyền chia sẻ tài liệu này" });
        }

        if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
            return res.status(400).json({ message: "Danh sách giáo viên không hợp lệ" });
        }

        // Xóa các chia sẻ cũ (hoặc chỉ insert mới tuỳ logic, ở đây insert ignore hoặc xoá rồi insert)
        await sequelize.query(
            'DELETE FROM user_materials WHERE material_id = ?',
            { replacements: [id], type: QueryTypes.DELETE }
        );

        for (const teacherId of teacherIds) {
            await sequelize.query(
                'INSERT INTO user_materials (user_id, material_id) VALUES (?, ?)',
                { replacements: [teacherId, id], type: QueryTypes.INSERT }
            );
        }

        res.status(200).json({ status: 'success', message: "Chia sẻ tài liệu thành công" });
    } catch (error) {
        console.error("Share Material Error:", error);
        res.status(500).json({ message: "Lỗi khi chia sẻ tài liệu" });
    }
};

/**
 * 3. Tracking: Ghi nhận tiến độ học tập của học sinh
 */
exports.trackProgress = async (req, res) => {
    try {
        const { material_id, quiz_id, action, progress, time_spent } = req.body;
        const userId = req.user.id;

        // Rule: đọc hết bài chỉ đạt 90%; 100% chỉ được nâng khi quiz đạt (xử lý ở tầng tổng hợp dữ liệu)
        let normalizedProgress = Number(progress) || 0;
        if (action === 'VIEWED_MATERIAL') {
            normalizedProgress = Math.max(0, Math.min(90, normalizedProgress));
        } else {
            normalizedProgress = Math.max(0, Math.min(100, normalizedProgress));
        }

        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, quiz_id, action, progress, time_spent) VALUES (?, ?, ?, ?, ?, ?)',
            {
                replacements: [userId, material_id || null, quiz_id || null, action, normalizedProgress, time_spent || 0],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({ status: 'success', message: "Đã ghi nhận tiến độ học tập" });
    } catch (error) {
        console.error("Tracking Error:", error);
        res.status(500).json({ message: "Không thể lưu lịch sử học tập" });
    }
};

/**
 * 3.1. Lấy thống kê thời gian học của học sinh (Cho Teacher/Admin)
 */
exports.getStudentTimeStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role_id; // 2: Teacher, 3: Admin

        // Nếu là Admin -> lấy toàn bộ. Nếu là Teacher -> chỉ lấy học sinh của Teacher đó
        let query = `
            SELECT 
                u.id as user_id, 
                u.name, 
                u.email,
                COALESCE(SUM(lh.time_spent), 0) as total_learning_time,
                (
                    SELECT COALESCE(SUM(r.time_taken), 0)
                    FROM results r WHERE r.user_id = u.id
                ) as total_quiz_time
            FROM users u
            LEFT JOIN learning_history lh ON lh.user_id = u.id
            WHERE u.role_id = 1
        `;
        let queryParams = [];

        if (userRole === 2) {
            query += ` AND u.id IN (
                SELECT gm.user_id FROM group_members gm
                JOIN \`groups\` g ON g.id = gm.group_id
                WHERE g.teacher_id = ?
            )`;
            queryParams.push(userId);
        }

        query += ` GROUP BY u.id`;

        const stats = await sequelize.query(query, {
            replacements: queryParams,
            type: QueryTypes.SELECT
        });

        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        console.error("Get Student Time Stats Error:", error);
        res.status(500).json({ message: "Không thể lấy thống kê thời gian học" });
    }
};

/**
 * 4. Lấy toàn bộ danh sách học liệu (Kèm tên người tạo)
 */
exports.getAllMaterials = async (req, res) => {
    try {
        const userId = req.user.id;
        const rows = await sequelize.query(
            `SELECT materials.*, users.name as creator_name 
             FROM materials 
             LEFT JOIN users ON materials.created_by = users.id 
             WHERE materials.visibility = 'public' 
                OR materials.created_by = ?
                OR materials.id IN (
                    SELECT gm.material_id 
                    FROM group_materials gm
                    JOIN group_members gmb ON gm.group_id = gmb.group_id
                    WHERE gmb.user_id = ?
                )
                OR materials.id IN (
                    SELECT um.material_id
                    FROM user_materials um
                    WHERE um.user_id = ?
                )
             ORDER BY materials.created_at DESC`,
            { replacements: [userId, userId, userId], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách học liệu" });
    }
};

/**
 * 5. Tìm kiếm nâng cao và Lọc học liệu
 */
exports.searchMaterials = async (req, res) => {
    try {
        const { q = '', sort = 'latest', creatorId, tag } = req.query;
        const trimmed = q.trim();

        const userId = req.user.id;
        let queryStr = `
            SELECT materials.*, users.name as creator_name 
            FROM materials 
            LEFT JOIN users ON materials.created_by = users.id 
            WHERE (materials.visibility = 'public' 
               OR materials.created_by = ?
               OR materials.id IN (
                   SELECT gm.material_id 
                   FROM group_materials gm
                   JOIN group_members gmb ON gm.group_id = gmb.group_id
                   WHERE gmb.user_id = ?
               )
               OR materials.id IN (
                   SELECT um.material_id
                   FROM user_materials um
                   WHERE um.user_id = ?
               ))
        `;
        const replacements = [userId, userId, userId];

        // Xử lý Search theo tiêu đề hoặc tag (kí hiệu @ hoặc #)
        if (trimmed) {
            const isTagSearch = trimmed.startsWith('@') || trimmed.startsWith('#');
            const keyword = trimmed.replace(/^[@#]/, '').trim();
            
            if (isTagSearch) {
                queryStr += ' AND (materials.tags LIKE ? OR materials.description LIKE ?)'; 
                replacements.push(`%${keyword}%`, `%${keyword}%`);
            } else {
                queryStr += ' AND materials.title LIKE ?';
                replacements.push(`%${keyword}%`);
            }
        }

        if (creatorId) {
            queryStr += ' AND materials.created_by = ?';
            replacements.push(creatorId);
        }

        if (tag) {
            queryStr += ' AND (materials.tags LIKE ? OR materials.description LIKE ?)';
            replacements.push(`%${tag}%`, `%${tag}%`);
        }

        // Sorting logic
        if (sort === 'oldest') {
            queryStr += ' ORDER BY materials.created_at ASC';
        } else if (sort === 'title') {
            queryStr += ' ORDER BY materials.title ASC';
        } else {
            queryStr += ' ORDER BY materials.created_at DESC';
        }

        const rows = await sequelize.query(queryStr, { replacements, type: QueryTypes.SELECT });

        res.status(200).json({
            status: 'success',
            data: rows,
            meta: { query: trimmed, sort, creatorId, tag }
        });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Lỗi khi tìm kiếm hoặc lọc học liệu" });
    }
};

/**
 * 6. Admin Stats: Thống kê hệ thống
 */
exports.getSystemStats = async (req, res) => {
    try {
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
 * 6.5 Lấy danh sách toàn bộ Tags duy nhất trong hệ thống (Hoặc theo creator)
 */
exports.getAllTags = async (req, res) => {
    try {
        const userId = req.user.id;
        const roleId = req.user.role_id;

        const [hasTagsColumn] = await sequelize.query(
            `SELECT COUNT(*) AS total
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'materials'
               AND COLUMN_NAME = 'tags'`,
            { type: QueryTypes.SELECT }
        );

        if (Number(hasTagsColumn?.total || 0) === 0) {
            return res.status(200).json({ status: 'success', data: [] });
        }

        let query = '';
        let replacements = [];

        if (roleId === 2 || roleId === 3) {
            // Giáo viên/Admin: Lấy tags từ tài liệu họ tạo hoặc public
            query = `
                SELECT tags FROM materials 
                WHERE (created_by = ? OR visibility = 'public') AND tags IS NOT NULL
            `;
            replacements = [userId];
        } else {
            // Học sinh: Lấy tags từ tài liệu public hoặc tài liệu được giao
            query = `
                SELECT tags FROM materials 
                WHERE (visibility = 'public' 
                   OR id IN (SELECT material_id FROM group_materials gm JOIN group_members gmb ON gm.group_id = gmb.group_id WHERE gmb.user_id = ?))
                AND tags IS NOT NULL
            `;
            replacements = [userId];
        }

        const rows = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
        
        // Xử lý chuỗi tags (VD: "Toán, Lý, Hóa") thành mảng unique
        const allTags = new Set();
        rows.forEach(row => {
            if (row.tags) {
                row.tags.split(',').forEach(t => {
                    const cleanTag = t.trim();
                    if (cleanTag) allTags.add(cleanTag);
                });
            }
        });

        res.status(200).json({ status: 'success', data: Array.from(allTags) });
    } catch (error) {
        console.error("Get Tags Error:", error);
        res.status(200).json({ status: 'success', data: [], success: false, message: 'Lỗi khi lấy danh sách tags', error: error.message });
    }
};

/**
 * 7. Gia sư ảo: Chat trực tiếp dựa trên nội dung bài học
 */
exports.chatWithAI = async (req, res) => {
    try {
        const { context, question } = req.body;
        
        if (!question) return res.status(400).json({ message: "Vui lòng nhập câu hỏi." });

        const prompt = `Bạn là một gia sư AI tận tâm tên là QuizVibe AI. Dựa vào nội dung tài liệu sau đây, hãy trả lời câu hỏi của học sinh một cách ngắn gọn, súc tích và thân thiện nhất.\nHãy dùng tiếng Việt.\n\nNội dung tài liệu:\n${context || 'Không có tài liệu cụ thể.'}\n\nCâu hỏi: ${question}`;
        
        const aiResponse = await aiService.generateContent(prompt);

        res.status(200).json({ status: 'success', answer: aiResponse });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ message: "AI đang bận, vui lòng thử lại sau." });
    }
};

/**
 * 8. Trình xử lý tệp tin (File/URL): Trích xuất nội dung + Sinh bài giảng thông minh
 * Tích hợp Gemini Native OCR cho PDF dưới 15MB
 */
exports.extractFileContent = async (req, res) => {
    try {
        let extractedText = null;
        let sourceTitle = 'Tài liệu không tên';
        let fileDataForGemini = null;

        if (req.file) {
            const { buffer, mimetype, originalname } = req.file;
            // Xử lý encode tên file tiếng Việt
            const decodedName = Buffer.from(originalname, 'latin1').toString('utf8');
            sourceTitle = decodedName.split('.')[0];

            // Trích xuất text thô (Server-side)
            extractedText = await extractTextFromBuffer(buffer, mimetype, decodedName);

            // Nếu file là ảnh hoặc không có text, thử gửi trực tiếp buffer lên Gemini (Native OCR)
            if ((!extractedText || extractedText.trim().length < 50) && mimetype === 'application/pdf' && buffer.length < 15 * 1024 * 1024) {
                fileDataForGemini = { buffer, mimeType: mimetype };
                extractedText = "Tài liệu này là một dạng PDF hình ảnh. Vui lòng phân tích dựa trên tệp đính kèm.";
            } else if (!extractedText || extractedText.trim().length < 50) {
                return res.status(415).json({ message: `Không thể trích xuất nội dung từ file "${originalname}". File có thể bị lỗi hoặc là ảnh không được hỗ trợ.` });
            }
        } else if (req.body.url) {
            const { url } = req.body;
            sourceTitle = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
            extractedText = await extractTextFromUrl(url);

            if (!extractedText || extractedText.length < 50) {
                return res.status(422).json({ message: 'Không thể trích xuất nội dung từ URL này.' });
            }
        } else {
            return res.status(400).json({ message: 'Vui lòng gửi file hoặc URL.' });
        }

        // Bước 1: Sinh bản nháp (Summary & Tags) dựa trên nội dung thực tế
        const contentSnippet = extractedText.substring(0, 4000);
        const draftPrompt = `Bạn là trợ lý giáo dục chuyên nghiệp. Dựa vào nội dung tài liệu sau, hãy:
        1. Đề xuất một "Tiêu đề chuyên nghiệp" (suggestedTitle) cho tài liệu này (Ví dụ: "Bài giảng Vật lý 11: Điện trường" thay vì "bai_giang_vat_ly_11").
        2. Viết tóm tắt ngắn gọn (3 câu) bao quát ý chính.
        3. Tự động xác định và trích xuất đúng 4 từ khóa (tags) quan trọng nhất liên quan đến chủ đề của tài liệu.
        
        QUY TẮC BẮT BUỘC:
        - Tiêu đề (suggestedTitle) phải là tiếng Việt có dấu, viết hoa chữ cái đầu, KHÔNG dùng dấu gạch dưới (_), KHÔNG dùng từ lóng.
        - Mỗi tag là cụm từ tiếng Việt tự nhiên, có dấu cách, KHÔNG dùng dấu gạch dưới (_), KHÔNG có ký tự # hay ##.
        - Ví dụ đúng: 
          suggestedTitle: "Định luật Bảo toàn Năng lượng"
          tags: ["Vật lí 12", "Cảm ứng điện từ", "Dòng điện xoay chiều", "Lớp 12"]
          
        Trả về kết quả duy nhất dưới định dạng JSON: {"suggestedTitle": "...", "summary": "...", "tags": ["...", "...", "...", "..."]} và tuyệt đối không kèm theo bất kỳ văn bản nào khác hoặc markdown.
        
        Nội dung tài liệu:
        ${contentSnippet}`;

        let aiDraftText = await aiService.generateContent(draftPrompt, fileDataForGemini);
        aiDraftText = aiDraftText.replace(/```json\n|\n```|```/g, '').trim();
        
        let parsedDraft;
        try { 
            parsedDraft = JSON.parse(aiDraftText);
            
            // 1. Ưu tiên tiêu đề từ AI, nếu không có thì làm sạch tên file cũ
            if (parsedDraft.suggestedTitle && parsedDraft.suggestedTitle.trim().length > 5) {
                sourceTitle = parsedDraft.suggestedTitle.replace(/_/g, ' ').trim();
            } else {
                sourceTitle = sourceTitle.replace(/_/g, ' ').trim();
            }

            // 2. Làm sạch tags: loại bỏ ##, # ở đầu và thay _ bằng dấu cách
            if (Array.isArray(parsedDraft.tags)) {
                parsedDraft.tags = parsedDraft.tags.map(tag => 
                    tag.replace(/^#+\s*/, '').replace(/_/g, ' ').trim()
                );
            }
        } catch (e) {
            console.error("JSON Parse Error for Draft:", aiDraftText);
            sourceTitle = sourceTitle.replace(/_/g, ' ').trim();
            parsedDraft = { 
                summary: "Tài liệu học thuật quan trọng. (AI đang xử lý nội dung chi tiết bên dưới)", 
                tags: ["Học liệu", "Cơ bản"] 
            };
        }

        // Bước 2: Sinh bài giảng Markdown chi tiết
        // Nếu fileDataForGemini được dùng (do trích xuất text thất bại), gửi file. Nếu không, chỉ gửi text (cực nhanh).
        const lessonPrompt = fileDataForGemini
            ? `Bạn là giáo viên. Hãy biên soạn một bài giảng Markdown chi tiết (gồm 3 chương lớn ##) dựa trên tài liệu đính kèm. Hãy tập trung vào các kiến thức cốt lõi.`
            : `Bạn là giáo viên. Hãy biên soạn một bài giảng Markdown chi tiết (gồm 3 chương lớn ##) dựa trên nội dung tài liệu sau. Hãy tập trung vào các kiến thức cốt lõi.
            
            Nội dung tài liệu:
            ${extractedText.substring(0, 10000)}`;
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
 * 9. Lấy tiến độ học tập cao nhất của người dùng đối với 1 học liệu cụ thể
 */
exports.getMaterialProgress = async (req, res) => {
    try {
        const { material_id } = req.params;
        const userId = req.user.id;
        const snapshot = await getMaterialLearningSnapshot(userId, material_id);

        res.status(200).json({
            status: 'success',
            progress: snapshot.progress,
            readingProgress: snapshot.readingProgress,
            quizStatus: snapshot.quizStatus,
            lastScore: snapshot.lastScore
        });
    } catch (error) {
        res.status(500).json({ message: 'Không thể tải tiến độ học tập.' });
    }
};

/**
 * 10. Dashboard: Phân quyền dữ liệu cho Student / Teacher / Admin
 */
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const roleId = req.user.role_id;

        // Xử lý cho Giáo viên (2) hoặc Admin (3)
        if (roleId === 2 || roleId === 3) {
            const matResult = await sequelize.query('SELECT COUNT(*) as count FROM materials WHERE created_by = ?', { replacements: [userId], type: QueryTypes.SELECT });
            const quizResult = await sequelize.query('SELECT COUNT(*) as count FROM quizzes WHERE created_by = ?', { replacements: [userId], type: QueryTypes.SELECT });
            const interactResult = await sequelize.query(
                `SELECT COUNT(lh.id) as count FROM learning_history lh
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

        // Xử lý cho Sinh viên (1)
                const [latestMaterialActivity] = await sequelize.query(
                        `SELECT activity.material_id, MAX(activity.activity_at) AS activity_at
                         FROM (
                                 SELECT material_id, created_at AS activity_at
                                 FROM learning_history
                                 WHERE user_id = ?
                                     AND material_id IS NOT NULL
                                     AND action = 'VIEWED_MATERIAL'

                                 UNION ALL

                                 SELECT material_id, COALESCE(created_at, submitted_at) AS activity_at
                                 FROM results
                                 WHERE user_id = ?
                                     AND material_id IS NOT NULL
                         ) activity
                         GROUP BY activity.material_id
                         ORDER BY activity_at DESC
                         LIMIT 1`,
                        { replacements: [userId, userId], type: QueryTypes.SELECT }
                );

        const statsResult = await sequelize.query(
            `SELECT COUNT(DISTINCT material_id) as total_learned FROM learning_history 
             WHERE user_id = ? AND ((action = 'VIEWED_MATERIAL' AND progress >= 50) OR action = 'COMPLETED_QUIZ')`,
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        const avgScoreResult = await sequelize.query('SELECT AVG(score) as avg_score FROM results WHERE user_id = ?', { replacements: [userId], type: QueryTypes.SELECT });

        let lastMaterial = null;
        if (latestMaterialActivity?.material_id) {
            const [materialRow] = await sequelize.query(
                `SELECT m.id, m.title, m.description, 
                        u.name as teacher_name, up.avatar_url as teacher_avatar
                 FROM materials m
                 LEFT JOIN users u ON m.created_by = u.id
                 LEFT JOIN user_profiles up ON u.id = up.user_id
                 WHERE m.id = ?
                 LIMIT 1`,
                { replacements: [latestMaterialActivity.material_id], type: QueryTypes.SELECT }
            );

            if (materialRow) {
                const snapshot = await getMaterialLearningSnapshot(userId, latestMaterialActivity.material_id);
                lastMaterial = {
                    ...materialRow,
                    progress: snapshot.progress,
                    readingProgress: snapshot.readingProgress,
                    quizStatus: snapshot.quizStatus,
                    lastScore: snapshot.lastScore,
                };
            }
        }

        const totalQuizzesResult = await sequelize.query('SELECT COUNT(*) as count FROM results WHERE user_id = ?', { replacements: [userId], type: QueryTypes.SELECT });

        res.status(200).json({
            status: 'success',
            data: {
                lastMaterial,
                stats: {
                    totalLearned: statsResult[0]?.total_learned || 0,
                    avgScore: avgScoreResult[0]?.avg_score ? parseFloat(avgScoreResult[0].avg_score).toFixed(1) : 0,
                    totalQuizzes: totalQuizzesResult[0]?.count || 0
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Không thể tải dữ liệu Dashboard.' });
    }
};

/**
 * 11. Admin: Xóa học liệu
 */
exports.deleteMaterialByAdmin = async (req, res) => {
    try {
        const materialId = req.params.id;
        await sequelize.query('DELETE FROM materials WHERE id = ?', { replacements: [materialId], type: QueryTypes.DELETE });
        res.status(200).json({ status: 'success', message: "Admin đã xóa học liệu thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa học liệu" });
    }
};

/**
 * 12. QUẢN LÝ LỚP HỌC (GROUPS)
 */
// Tạo lớp học mới (Dành cho Teacher/Admin)
exports.createGroup = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const teacherId = req.user.id;

        const [groupId] = await sequelize.query(
            'INSERT INTO `groups` (name, description, color, teacher_id) VALUES (?, ?, ?, ?)',
            { replacements: [name, description, color || '#06b6d4', teacherId], type: QueryTypes.INSERT }
        );

        res.status(201).json({ status: 'success', data: { id: groupId, name, color: color || '#06b6d4' } });
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({ message: 'Không thể tạo lớp học' });
    }
};

// Cập nhật thông tin lớp học
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;
        const teacherId = req.user.id;

        // Verify ownership
        const [group] = await sequelize.query('SELECT * FROM `groups` WHERE id = ? AND teacher_id = ?', {
            replacements: [id, teacherId],
            type: QueryTypes.SELECT
        });

        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm hoặc bạn không có quyền' });
        }

        await sequelize.query(
            'UPDATE `groups` SET name = ?, description = ?, color = ? WHERE id = ?',
            { replacements: [name, description, color, id], type: QueryTypes.UPDATE }
        );

        res.status(200).json({ status: 'success', message: 'Cập nhật nhóm thành công' });
    } catch (error) {
        console.error('Update Group Error:', error);
        res.status(500).json({ message: 'Không thể cập nhật nhóm' });
    }
};

// Lấy danh sách các lớp học mà Giáo viên đang quản lý
exports.getTeacherGroups = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const groups = await sequelize.query(
            `SELECT g.*, COUNT(gm.user_id) as student_count 
             FROM \`groups\` g 
             LEFT JOIN group_members gm ON g.id = gm.group_id 
             WHERE g.teacher_id = ? 
             GROUP BY g.id 
             ORDER BY g.created_at DESC`,
            { replacements: [teacherId], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: groups });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách lớp học' });
    }
};

// Lấy danh sách các lớp học mà Học sinh đang tham gia
exports.getStudentGroups = async (req, res) => {
    try {
        const studentId = req.user.id;
        const groups = await sequelize.query(
            `SELECT g.*, u.name as teacher_name 
             FROM \`groups\` g 
             JOIN group_members gm ON g.id = gm.group_id 
             JOIN users u ON g.teacher_id = u.id 
             WHERE gm.user_id = ? 
             ORDER BY gm.joined_at DESC`,
            { replacements: [studentId], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: groups });
    } catch (error) {
        console.error('Get Student Groups Error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách lớp học của học sinh' });
    }
};

// Thêm danh sách học sinh vào lớp học (Sử dụng INSERT IGNORE để tránh trùng lặp)
exports.addGroupMembers = async (req, res) => {
    try {
        const { group_id, user_ids } = req.body; // user_ids là mảng [1, 2, 3]

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ message: 'Danh sách học sinh không hợp lệ' });
        }

        const [groupRows] = await sequelize.query(
            'SELECT capacity FROM `groups` WHERE id = ?',
            { replacements: [group_id], type: QueryTypes.SELECT }
        );

        if (!groupRows) {
            return res.status(404).json({ message: 'Lớp học không tồn tại' });
        }

        const [{ currentCount }] = await sequelize.query(
            'SELECT COUNT(*) as currentCount FROM group_members WHERE group_id = ?',
            { replacements: [group_id], type: QueryTypes.SELECT }
        );

        if (currentCount + user_ids.length > groupRows.capacity) {
            return res.status(400).json({ message: `Không thể thêm. Lớp học đã đạt tối đa ${groupRows.capacity} học sinh` });
        }

        const values = user_ids.map(uid => `(${group_id}, ${uid})`).join(',');
        await sequelize.query(
            `INSERT IGNORE INTO group_members (group_id, user_id) VALUES ${values}`,
            { type: QueryTypes.INSERT }
        );

        res.status(200).json({ status: 'success', message: 'Đã thêm học sinh vào lớp' });
    } catch (error) {
        console.error("Add Group Members Error:", error);
        res.status(500).json({ message: 'Không thể thêm học sinh' });
    }
};

// Xóa học sinh khỏi lớp học
exports.removeGroupMember = async (req, res) => {
    try {
        const { id: groupId, studentId } = req.params;
        const teacherId = req.user.id;

        // Verify group belongs to teacher
        const group = await sequelize.query('SELECT * FROM `groups` WHERE id = ? AND teacher_id = ?', { 
            replacements: [groupId, teacherId], 
            type: QueryTypes.SELECT 
        });

        if (!group || group.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm hoặc bạn không có quyền' });
        }

        await sequelize.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', {
            replacements: [groupId, studentId],
            type: QueryTypes.DELETE
        });

        res.status(200).json({ status: 'success', message: 'Đã xóa học sinh khỏi lớp' });
    } catch (error) {
        console.error('Remove Member Error:', error);
        res.status(500).json({ message: 'Không thể xóa học sinh' });
    }
};

// Giao học liệu cho cả lớp (Tất cả học sinh trong lớp sẽ thấy tài liệu này trong "My Lessons")
exports.assignMaterialToGroup = async (req, res) => {
    try {
        const { group_id, material_id } = req.body;

        await sequelize.query(
            'INSERT IGNORE INTO group_materials (group_id, material_id) VALUES (?, ?)',
            { replacements: [group_id, material_id], type: QueryTypes.INSERT }
        );

        res.status(200).json({ status: 'success', message: 'Đã giao bài cho lớp' });
    } catch (error) {
        res.status(500).json({ message: 'Không thể giao bài học' });
    }
};

// Lấy thông tin chi tiết một lớp học: Tên lớp, Danh sách học sinh, Danh sách bài học đã giao
exports.getGroupDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy thông tin cơ bản của lớp
        const group = await sequelize.query('SELECT * FROM `groups` WHERE id = ?', { replacements: [id], type: QueryTypes.SELECT });
        
        if (!group[0]) return res.status(404).json({ message: 'Không tìm thấy lớp' });

        // Lấy danh sách học sinh thuộc lớp
        const students = await sequelize.query(
            `SELECT u.id, u.name, u.email, up.avatar_url as avatar 
             FROM users u 
             LEFT JOIN user_profiles up ON u.id = up.user_id
             INNER JOIN group_members gm ON u.id = gm.user_id 
             WHERE gm.group_id = ?`,
            { replacements: [id], type: QueryTypes.SELECT }
        );

        // Lấy danh sách học liệu đã được giao cho lớp này
        const materials = await sequelize.query(
            `SELECT m.id, m.title 
             FROM materials m 
             INNER JOIN group_materials gm ON m.id = gm.material_id 
             WHERE gm.group_id = ?`,
            { replacements: [id], type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 'success',
            data: {
                ...group[0],
                students,
                materials
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy chi tiết lớp học' });
    }
};

// Xóa nhóm học tập
exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        
        // Ensure the group belongs to the teacher before deleting
        const group = await sequelize.query('SELECT * FROM `groups` WHERE id = ? AND teacher_id = ?', { 
            replacements: [id, teacherId], 
            type: QueryTypes.SELECT 
        });

        if (!group || group.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm hoặc bạn không có quyền xóa' });
        }

        await sequelize.query('DELETE FROM `groups` WHERE id = ?', { 
            replacements: [id], 
            type: QueryTypes.DELETE 
        });

        res.status(200).json({ status: 'success', message: 'Đã xóa nhóm thành công' });
    } catch (error) {
        console.error('Delete Group Error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa nhóm học tập' });
    }
};

// Lấy danh sách toàn bộ học sinh (Role = 1) để giáo viên có thể thêm vào lớp
exports.getStudentsForTeacher = async (req, res) => {
    try {
        const students = await sequelize.query(
            `SELECT u.id, u.name, u.email, up.avatar_url as avatar, 
             (SELECT gm.group_id FROM group_members gm WHERE gm.user_id = u.id LIMIT 1) as group_id
             FROM users u 
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE u.role_id = 1`,
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: students });
    } catch (error) {
        console.error('Get Students Error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách học sinh' });
    }
};

// Lấy danh sách toàn bộ phiếu học tập do giáo viên tạo
exports.getAllWorksheetsForTeacher = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const worksheets = await sequelize.query(
            'SELECT * FROM worksheets WHERE created_by = ? ORDER BY created_at DESC',
            { replacements: [teacherId], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: worksheets });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách phiếu học tập' });
    }
};

/**
 * 13. PHIẾU HỌC TẬP (WORKSHEETS) - TỰ ĐỘNG SINH BẰNG AI
 */
// Hàm gọi AI để sinh ra một Phiếu học tập gồm các câu hỏi tự luận và bài tập từ nội dung học liệu
exports.generateWorksheetWithAI = async (req, res) => {
    try {
        const { material_id, title } = req.body;

        // Lấy nội dung học liệu từ DB để cung cấp context cho AI
        const material = await sequelize.query(
            'SELECT * FROM materials WHERE id = ?',
            { replacements: [material_id], type: QueryTypes.SELECT }
        );

        if (!material[0]) return res.status(404).json({ message: 'Không tìm thấy học liệu' });

        // Prompt yêu cầu AI đóng vai giáo viên để tạo câu hỏi tự luận
        const prompt = `Bạn là một giáo viên chuyên nghiệp. Dựa vào nội dung tài liệu sau, hãy tạo một "Phiếu học tập" gồm 5 câu hỏi tự luận giúp học sinh đào sâu kiến thức.
        Nội dung: ${material[0].content.substring(0, 4000)}
        
        Vui lòng trả về kết quả theo cấu trúc JSON:
        {
           "title": "Tên phiếu học tập",
           "questions": [
              {"id": 1, "question": "Câu hỏi 1...", "hint": "Gợi ý trả lời..."},
              ...
           ]
        }
        Lưu ý: Chỉ trả về JSON, không kèm văn bản khác.`;

        let aiResult = await aiService.generateContent(prompt);
        // Trích xuất JSON từ phản hồi của AI (phòng trường hợp AI thêm văn bản thừa)
        const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI không trả về định dạng JSON hợp lệ.");
        }
        
        const parsedContent = JSON.parse(jsonMatch[0]);

        // Lưu thông tin phiếu học tập đã sinh vào Database
        const [worksheetId] = await sequelize.query(
            'INSERT INTO worksheets (material_id, title, content, created_by) VALUES (?, ?, ?, ?)',
            {
                replacements: [material_id, title || parsedContent.title, JSON.stringify(parsedContent.questions), req.user.id],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({
            status: 'success',
            data: { id: worksheetId, title: title || parsedContent.title, questions: parsedContent.questions }
        });
    } catch (error) {
        console.error('Generate Worksheet Error:', error);
        res.status(500).json({ message: 'AI hiện không thể sinh phiếu học tập' });
    }
};

// Hàm lưu bài làm của học sinh cho Phiếu học tập
exports.submitWorksheet = async (req, res) => {
    try {
        const { worksheet_id, answers } = req.body; // Cấu trúc answers: [{question_id: 1, answer: "..."}]
        const userId = req.user.id;

        await sequelize.query(
            'INSERT INTO worksheet_submissions (worksheet_id, user_id, answers) VALUES (?, ?, ?)',
            {
                replacements: [worksheet_id, userId, JSON.stringify(answers)],
                type: QueryTypes.INSERT
            }
        );

        res.status(200).json({ status: 'success', message: 'Đã nộp phiếu học tập thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Không thể nộp bài' });
    }
};

// Lấy danh sách phiếu học tập dành cho học sinh (Dựa vào các lớp mà học sinh tham gia)
exports.getWorksheetsForStudent = async (req, res) => {
    try {
        const userId = req.user.id;
        const worksheets = await sequelize.query(
            `SELECT w.*, g.name as group_name, m.title as material_title 
             FROM worksheets w
             INNER JOIN materials m ON w.material_id = m.id
             INNER JOIN group_materials gm ON m.id = gm.material_id
             INNER JOIN group_members gmb ON gm.group_id = gmb.group_id
             INNER JOIN \`groups\` g ON gm.group_id = g.id
             WHERE gmb.user_id = ?
             ORDER BY w.created_at DESC`,
            { replacements: [userId], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: worksheets });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách phiếu học tập' });
    }
};

// Lấy chi tiết một phiếu học tập cụ thể (Cho phép xem công khai)
exports.getWorksheetById = async (req, res) => {
    try {
        const { id } = req.params;
        const worksheet = await sequelize.query(
            'SELECT * FROM worksheets WHERE id = ?',
            { replacements: [id], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) return res.status(404).json({ message: 'Không tìm thấy phiếu học tập' });

        res.status(200).json({ status: 'success', data: worksheet[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin phiếu học tập' });
    }
};

// Xóa phiếu học tập
exports.deleteWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        // Kiểm tra quyền sở hữu
        const worksheet = await sequelize.query(
            'SELECT * FROM worksheets WHERE id = ? AND created_by = ?',
            { replacements: [id, teacherId], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu học tập hoặc bạn không có quyền xóa' });
        }

        await sequelize.query('DELETE FROM worksheets WHERE id = ?', {
            replacements: [id],
            type: QueryTypes.DELETE
        });

        res.status(200).json({ status: 'success', message: 'Đã xóa phiếu học tập thành công' });
    } catch (error) {
        console.error('Delete Worksheet Error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa phiếu học tập' });
    }
};

// Lấy danh sách toàn bộ phiếu học tập thuộc về một học liệu cụ thể
exports.getWorksheetsByMaterial = async (req, res) => {
    try {
        const { material_id } = req.params;
        const worksheets = await sequelize.query(
            'SELECT * FROM worksheets WHERE material_id = ? ORDER BY created_at DESC',
            { replacements: [material_id], type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: worksheets });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách phiếu học tập' });
    }
};