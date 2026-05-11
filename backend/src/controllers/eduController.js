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
            return res.status(404).json({ success: false, message: "Không tìm thấy học liệu này", data: null, errorCode: "MATERIAL_NOT_FOUND" });
        }

        const material = materials[0];
        
        // Ưu tiên dùng 'content' (nội dung chi tiết) để AI tóm tắt chính xác hơn description
        const textToAnalyze = material.content || material.description;

        const prompt = `Bạn là trợ lý giáo dục. Hãy tóm tắt nội dung sau thành 5 gạch đầu dòng và liệt kê 5 từ khóa chính (keywords). 
                        Nội dung: ${textToAnalyze}`;
        
        const aiResult = await aiService.generateContent(prompt);

        // Ghi lại lịch sử là người dùng đã xem tài liệu này (đềc hết bài = 90%)
        await sequelize.query(
            'INSERT INTO learning_history (user_id, material_id, action, progress) VALUES (?, ?, ?, ?)',
                {
                replacements: [req.user.id, materialId, 'VIEWED_MATERIAL', 90],
                    type: QueryTypes.INSERT
        }
        );

        res.status(200).json({ success: true, message: "Phân tích học liệu thành công", data: { material_title: material.title, ai_analysis: aiResult }, errorCode: null });
    } catch (error) {
        console.error("AI Process Error:", error);
        res.status(500).json({ success: false, message: "Lỗi xử lý AI hoặc kết nối Database", data: null, errorCode: "PROCESS_MATERIAL_AI_FAILED" });
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
            console.warn('[AI_FALLBACK] analyzeDraftMaterial JSON parse failed, using fallback summary/tags:', e.message);
            // Fallback nếu JSON parse lỗi
            parsedResult = {
                summary: "Tài liệu này cung cấp kiến thức nền tảng quan trọng giúp học sinh nắm vững các khái niệm trọng tâm.",
                tags: ["Giáo dục", "Học liệu", "Cơ bản", "Quan trọng"]
};
        }

        res.status(200).json({ success: true, message: "Phân tích nháp thành công", data: parsedResult, errorCode: null });
    } catch (error) {
        console.error("AI Draft Analyze Error:", error);
        res.status(500).json({ success: false, message: "AI hiện không thể phân tích tài liệu này.", data: null, errorCode: "ANALYZE_DRAFT_FAILED" });
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

        // 2. [CẬP NHẬT] Độá¢â‚¬â„¢NG BỘ TOếN DI??N: Lấy toàn bộ dữ liệu từ DB để ghi đề vào file JSON
        // Cách này đảm bảo ID 3, ID 4 và các ID cũ đều sẽ xuất hiện đầy đủ trong file
        const jsonPath = path.join(__dirname, '../database/data/materials.json'); 
        
        // Truy vấn tất cả học liệu đang có trong DB
        const allMaterials = await sequelize.query(
            'SELECT * FROM materials ORDER BY id ASC',
            { type: QueryTypes.SELECT }
        );

        // Chuyển độá¢â‚¬¢i định dạng dữ liệu (Mapping) nếu cần thiết để khớp với cấu trúc JSON mong muốn
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

        // Ghi đề toàn bộ nội dung mới vào file materials.json
        fs.writeFileSync(jsonPath, JSON.stringify(formattedData, null, 4), 'utf8');

        res.status(201).json({ success: true, message: "Tạo học liệu thành công và đã đồng bộ toàn bộ file JSON", data: { id: resultId, title }, errorCode: null });

    } catch (error) {
        console.error("Create Material Sync Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi tạo học liệu hoặc lỗi đồng bộ file hệ thống", data: null, errorCode: "CREATE_MATERIAL_FAILED" });
        }
};

exports.updateMaterialVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { visibility } = req.body;
        const userId = req.user.id; 

        if (!['public', 'private'].includes(visibility)) {
            return res.status(400).json({ success: false, message: "Visibility không hợp lệ", data: null, errorCode: "INVALID_VISIBILITY" });
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

        res.status(200).json({ success: true, message: "Cập nhật quyền riêng tư thành công", data: null, errorCode: null });
    } catch (error) {
        console.error("Update Visibility Error:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật quyền riêng tư", data: null, errorCode: "UPDATE_VISIBILITY_FAILED" });
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
        res.status(200).json({ success: true, message: "Lấy danh sách giáo viên thành công", data: teachers, errorCode: null });
    } catch (error) {
        console.error("Get Teachers Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách giáo viên", data: null, errorCode: "GET_TEACHERS_FAILED" });
        }
};

exports.shareMaterialToTeachers = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherIds } = req.body;
        const userId = req.user.id; 

        // Xác nhận quyền sộá…¸ hữu
        const [materials] = await sequelize.query(
            'SELECT id FROM materials WHERE id = ? AND created_by = ?',
            { replacements: [id, userId], type: QueryTypes.SELECT }
        );

        if (!materials) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chia sề tài liệu này", data: null, errorCode: "SHARE_FORBIDDEN" });
        }

        if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách giáo viên không hợp lệ", data: null, errorCode: "INVALID_TEACHER_IDS" });
        }

        // Xóa các chia sề cũ (hoặc ch?? insert mới tu? logic, ộá…¸ đây insert ignore hoặc xoá rồngi insert)
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

        res.status(200).json({ success: true, message: "Chia sẻ tài liệu thành công", data: null, errorCode: null });
    } catch (error) {
        console.error("Share Material Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi chia sề tài liệu", data: null, errorCode: "SHARE_MATERIAL_FAILED" });
        }
};

/**
 * 3. Tracking: Ghi nhận tiến đnội học tập của học sinh
 */
exports.trackProgress = async (req, res) => {
    try {
        const { material_id, quiz_id, action, progress, time_spent } = req.body;
        const userId = req.user.id; 

        // Rule: đềc hết bài chộá¢â‚¬° đạt 90%; 100% chộá¢â‚¬° đá€ °ợc nâng khi quiz đạt (xử lý ộá…¸ tầng t??ng hợp dữ liệu)
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

        res.status(201).json({ success: true, message: "Đã ghi nhận tiến đnội học tập", data: null, errorCode: null });
    } catch (error) {
        console.error("Tracking Error:", error);
        res.status(500).json({ success: false, message: "Không thể lưu lịch sử học tập", data: null, errorCode: "TRACK_PROGRESS_FAILED" });
        }
};

/**
 * 3.1. Lấy thống kê th??i gian học của học sinh (Cho Teacher/Admin)
 */
exports.getStudentTimeStats = async (req, res) => {
    try {
        const userId = req.user.id; 
        const userRole = req.user.role_id; // 2: Teacher, 3: Admin

        // Nếu là Admin -> lấy toàn bộ. Nếu là Teacher -> ch?? l?y học sinh của Teacher đó
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

        res.status(200).json({ success: true, message: "Lấy thống kê th??i gian học thành công", data: stats, errorCode: null });
    } catch (error) {
        console.error("Get Student Time Stats Error:", error);
        res.status(500).json({ success: false, message: "Không thể lấy thống kê th??i gian học", data: null, errorCode: "GET_STUDENT_TIME_STATS_FAILED" });
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
        res.status(200).json({ success: true, message: "Lấy danh sách học liệu thành công", data: rows, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách học liệu", data: null, errorCode: "GET_ALL_MATERIALS_FAILED" });
        }
};

/**
 * 5. Tìm kiếm nâng cao và Lờc học liệu
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
            success: true,
            message: "Tìm kiếm học liệu thành công",
            data: rows,
            meta: { query: trimmed, sort, creatorId, tag },
            errorCode: null
        });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi tìm kiếm hoặc l??c học liệu", data: null, errorCode: "SEARCH_MATERIALS_FAILED" });
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

        res.status(200).json({ success: true, message: "Lấy thống kê hệ thống thành công", data: stats[0], errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy thống kê hệ thống", data: null, errorCode: "GET_SYSTEM_STATS_FAILED" });
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
            return res.status(200).json({ success: true, message: "Lấy danh sách tags thành công", data: [], errorCode: null });
        }

        let query = '';
        let replacements = [];

        if (roleId === 2 || roleId === 3) {
            // Giáo viên/Admin: Lấy tags từ tài liệu hờ tạo hoặc public
            query = `
                SELECT tags FROM materials 
                WHERE (created_by = ? OR visibility = 'public') AND tags IS NOT NULL
            `;
            replacements = [userId];
        } else {
            // H??c sinh: Lấy tags từ tài liệu public hoặc tài liệu đá€ °ợc giao
            query = `
                SELECT tags FROM materials 
                WHERE (visibility = 'public' 
                   OR id IN (SELECT material_id FROM group_materials gm JOIN group_members gmb ON gm.group_id = gmb.group_id WHERE gmb.user_id = ?))
                AND tags IS NOT NULL
            `;
            replacements = [userId];
        }

        const rows = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
        
        // Xử lý chulỗii tags (VD: "Toán, Lý, Hóa") thành mảng unique
        const allTags = new Set();
        rows.forEach(row => {
            if (row.tags) {
                row.tags.split(',').forEach(t => {
                    const cleanTag = t.trim();
                    if (cleanTag) allTags.add(cleanTag);
        });
        }
        });

        res.status(200).json({ success: true, message: "Lấy danh sách tags thành công", data: Array.from(allTags), errorCode: null });
    } catch (error) {
        console.error("Get Tags Error:", error);
        res.status(200).json({ success: false, message: 'Lỗi khi lấy danh sách tags', data: [], errorCode: 'GET_TAGS_FAILED' });
        }
};

/**
 * 7. Gia sư ảo: Chat trực tiếp dựa trên nội dung bài học
 */
exports.chatWithAI = async (req, res) => {
    try {
        const { context, question } = req.body;
        
        if (!question) return res.status(400).json({ success: false, message: "Vui lòng nhập câu h??i.", data: null, errorCode: "MISSING_QUESTION" });

        const prompt = `Bạn là một gia sư AI tận tâm tên là QuizVibe AI. Dựa vào nội dung tài liệu sau đây, hãy trả lời câu h??i của học sinh một cách ngắn gọn, súc tích và thân thiện nhất.\nHãy dùng tiếng Việt.\n\nNội dung tài liệu:\n${context || 'Không có tài liệu cụ thể.'}\n\nCâu h??i: ${question}`;
        
        const aiResponse = await aiService.generateContent(prompt);

        res.status(200).json({ success: true, message: "AI trả lời thành công", data: { answer: aiResponse }, errorCode: null });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ success: false, message: "AI đang bận, vui lòng thử lại sau.", data: null, errorCode: "CHAT_AI_FAILED" });
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

            // 1. Trích xuất text thô (Server-side)
            extractedText = await extractTextFromBuffer(buffer, mimetype, decodedName);

            // 2. Hlỗi trợ Multimedia (Video/Audio) trực tiếp
            if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) {
                extractedText = `[NỘI DUNG ĐA PHƯƠNG TI??N]\nTên file: ${decodedName}\nĐộá¢â‚¬¹nh dạng: ${mimetype}\nĐây là một tệp video/âm thanh. Hãy phân tích dựa trên tiêu đề và ngữ cảnh chuyên môn của bạn.`;
        }

            // 3. Nếu file là ảnh hoặc không có text, thử gửi trực tiếp buffer lên Gemini (Native OCR)
            if ((!extractedText || extractedText.trim().length < 50) && mimetype === 'application/pdf' && buffer.length < 15 * 1024 * 1024) {
                fileDataForGemini = { buffer, mimeType: mimetype };
                extractedText = "Tài liệu này là một dạng PDF hình ảnh. Vui lòng phân tích dựa trên tệp đính kèm.";
            } else if (!extractedText || extractedText.trim().length < 50) {
                return res.status(415).json({ success: false, message: `Không thể trích xuất nội dung từ file "${originalname}". File có thể bộá¢â‚¬¹ lỗi hoặc định dạng không đá€ °ợc hlỗi trợ.`, data: null, errorCode: "UNSUPPORTED_FILE" });
        }
        } else if (req.body.url) {
            const { url } = req.body;
            const isMediaUrl = /youtube\.com|youtu\.be|\.mp4|\.webm|\.mov|\.mp3|\.wav|\.ogg/i.test(url);
            
            sourceTitle = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
            
            // Luôn thử trích xuất text từ URL (đặc biệt hữu ích cho YouTube Transcript)
            extractedText = await extractTextFromUrl(url);

            // Nếu là Media (VD: MP4 trực tiếp) hoặc không lấy đá€ °ợc phụ đề YouTube, dùng placeholder
            if ((!extractedText || extractedText.length < 100) && isMediaUrl) {
                extractedText = `[LIáN Kấ¾T ĐA PHƯƠNG TI??N]\nURL: ${url}\nĐây là một liên kết YouTube hoặc Multimedia. Hãy dựa vào tiêu đề URL và kiến thức chuyên môn của bạn để tóm tắt chủ đề giáo dục tương ứng.`;
        }

            // Cố gắng lấy phần cuối của URL để làm tiêu đề sá bộ nếu không phải youtube
            const urlParts = url.split('/').filter(p => p.length > 0);
            sourceTitle = urlParts[urlParts.length - 1] || url;
            if (sourceTitle.length > 50) sourceTitle = sourceTitle.substring(0, 50);

            if (!extractedText || extractedText.length < 50) {
                return res.status(422).json({ success: false, message: "Không thể trích xuất nội dung từ URL này.", data: null, errorCode: "EXTRACT_URL_FAILED" });
        }
        } else {
            return res.status(400).json({ success: false, message: "Vui lòng gửi file hoặc URL.", data: null, errorCode: "MISSING_FILE_OR_URL" });
        }

        // Bước 1: Sinh bản nháp (Summary & Tags) dựa trên nội dung thực tế
        const contentSnippet = extractedText.substring(0, 4000);
                const draftPrompt = `Bạn là trợ lý giáo dục chuyên nghiệp. Dựa vào nội dung tài liệu sau, hãy:
        1. Đề xuất một "Tiêu đề chuyên nghiệp" (suggestedTitle) cho tài liệu này (Ví dụ: "Kỹ năng Giao tiếp Hiệu quả" hoặc "Kiến thức Lịch sử Thế giới").
        2. Viết tóm tắt ngắn gọn (3 câu) bao quát ý chính.
        3. Tự động xác định và trích xuất đúng 4 từ khóa (tags) quan trọng nhất liên quan đến chủ đề.
        
        QUY TẮC BẮT BUỘC:
        - TUYỆT ĐỐI KHÔNG tự tiện đưa các chủ đề Vật lý hay Toán học vào nếu tài liệu không nhắc tới.
        - Tiêu đề (suggestedTitle) phải là tiếng Việt có dấu, viết hoa chữ cái đầu.
        - Trả về kết quả duy nhất dưới định dạng JSON: {"suggestedTitle": "...", "summary": "...", "tags": ["...", "...", "...", "..."]}`;
        
        const finalPrompt = draftPrompt + "\n\nNội dung tài liệu:\n" + extractedText.substring(0, 4000);

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

            // 2. Làm sạch tags: loại bờ  ##, # ộá…¸ đầu và thay _ bấ±ng dấu cách
            if (Array.isArray(parsedDraft.tags)) {
                parsedDraft.tags = parsedDraft.tags.map(tag => 
                    tag.replace(/^#+\s*/, '').replace(/_/g, ' ').trim()
        );
        }
        } catch (e) {
            console.warn('[AI_FALLBACK] extractFileContent draft JSON parse failed, using fallback summary/tags:', e.message);
            console.error("JSON Parse Error for Draft:", aiDraftText);
            sourceTitle = sourceTitle.replace(/_/g, ' ').trim();
            parsedDraft = {
                summary: "Tài liệu học thuật quan trọng. (AI đang xử lý nội dung chi tiết bên dưới)", 
                tags: ["H??c liệu", "Cơ bản"] 
};
        }

        // Bước 2: Sinh bài giảng Markdown chi tiết
        // Nếu fileDataForGemini đá€ °ợc dùng (do trích xuất text thất bại), gửi file. Nếu không, ch?? g?i text (cực nhanh).
        const lessonPrompt = fileDataForGemini
            ? `Bạn là giáo viên. Hãy biên soạn một bài giảng Markdown chi tiết (gồm 3 chương l??n ##) dựa trên tài liệu đính kèm. Hãy tập trung vào các kiến thức cốt láµi.`
            : `Bạn là giáo viên. Hãy biên soạn một bài giảng Markdown chi tiết (gồm 3 chương l??n ##) dựa trên nội dung hoặc tiêu đề tài liệu sau. 
               Lưu ý: Nếu đây là tệp Đa phương tiện hoặc Link Video, hãy dùng kiến thức chuyên môn của bạn để viết một bài giảng học thuật hoàn chọnh và sâu sắc xoay quanh chủ đề đó.
            
            Nội dung/Tiêu đề tài liệu:
            ${extractedText.substring(0, 10000)}`;
        const lessonContent = await aiService.generateContent(lessonPrompt, fileDataForGemini);

        return res.status(200).json({
            success: true,
            message: "Trích xuất và phân tích tài liệu thành công",
            data: {
                title: sourceTitle,
                summary: parsedDraft.summary,
                tags: parsedDraft.tags,
                lessonContent
            },
            errorCode: null
        });
    } catch (error) {
        console.error('Extract Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xử lý tài liệu.', data: null, errorCode: "EXTRACT_FILE_FAILED" });
        }
};

/**
 * 9. Lấy tiến đnội học tập cao nhất của người dùng độá¢â‚¬Ëœi với 1 học liệu cụ thể
 */
exports.getMaterialProgress = async (req, res) => {
    try {
        const { material_id } = req.params;
        const userId = req.user.id; 
        const snapshot = await getMaterialLearningSnapshot(userId, material_id);

        res.status(200).json({
            success: true,
            message: "Lấy tiến đnội học tập thành công",
            data: {
                progress: snapshot.progress,
                readingProgress: snapshot.readingProgress,
                quizStatus: snapshot.quizStatus,
                lastScore: snapshot.lastScore
            },
            errorCode: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể tải tiến đnội học tập.', data: null, errorCode: "GET_MATERIAL_PROGRESS_FAILED" });
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
                { replacements: [userId, userId, userId, userId], type: QueryTypes.SELECT }
        );

        return res.status(200).json({
                success: true,
                message: "Lấy dữ liệu dashboard thành công",
            data: {
                    stats: {
                        totalMaterials: matResult[0]?.count || 0,
                        totalQuizzes: quizResult[0]?.count || 0,
                        totalInteractions: interactResult[0]?.count || 0
        }
                },
                errorCode: null
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
                        { replacements: [userId, userId, userId, userId], type: QueryTypes.SELECT }
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
            success: true,
            message: "Lấy dữ liệu dashboard thành công",
            data: {
                lastMaterial,
                stats: {
                    totalLearned: statsResult[0]?.total_learned || 0,
                    avgScore: avgScoreResult[0]?.avg_score ? parseFloat(avgScoreResult[0].avg_score).toFixed(1) : 0,
                    totalQuizzes: totalQuizzesResult[0]?.count || 0
        }
            },
            errorCode: null
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Không thể tải dữ liệu Dashboard.', data: null, errorCode: "GET_USER_DASHBOARD_FAILED" });
        }
};

/**
 * 11. Admin: Xóa học liệu
 */
exports.deleteMaterialByAdmin = async (req, res) => {
    try {
        const materialId = req.params.id;
        await sequelize.query('DELETE FROM materials WHERE id = ?', { replacements: [materialId], type: QueryTypes.DELETE });
        res.status(200).json({ success: true, message: "Admin đã xóa học liệu thành công", data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa học liệu", data: null, errorCode: "DELETE_MATERIAL_FAILED" });
        }
};

/**
 * 12. QUấ¢N Lá LờP H??C (GROUPS)
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

        res.status(201).json({ success: true, message: "Tạo lớp học thành công", data: { id: groupId, name, color: color || '#06b6d4' }, errorCode: null });
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo lớp học', data: null, errorCode: "CREATE_GROUP_FAILED" });
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
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm hoặc bạn không có quyền', data: null, errorCode: "GROUP_NOT_FOUND" });
        }

        await sequelize.query(
            'UPDATE `groups` SET name = ?, description = ?, color = ? WHERE id = ?',
            { replacements: [name, description, color, id], type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, message: 'Cập nhật nhóm thành công', data: null, errorCode: null });
    } catch (error) {
        console.error('Update Group Error:', error);
        res.status(500).json({ success: false, message: 'Không thể cập nhật nhóm', data: null, errorCode: "UPDATE_GROUP_FAILED" });
        }
};

// Lấy danh sách phiếu học tập dành cho học sinh (Dựa vào các lớp mà học sinh tham gia)
exports.getWorksheetsForStudent = async (req, res) => {
    try {
        const userId = req.user.id; 

        const worksheets = await sequelize.query(
            `(SELECT w.*, g.name as group_name, m.title as material_title, s.id as submission_id, s.score, s.feedback
              FROM worksheets w
              LEFT JOIN materials m ON w.material_id = m.id
              INNER JOIN group_worksheets gw ON w.id = gw.worksheet_id
              INNER JOIN group_members gmb ON gw.group_id = gmb.group_id
              INNER JOIN \`groups\` g ON gw.group_id = g.id
              LEFT JOIN worksheet_submissions s ON w.id = s.worksheet_id AND s.user_id = ?
              WHERE gmb.user_id = ?)
             UNION
             (SELECT w.*, g.name as group_name, m.title as material_title, s.id as submission_id, s.score, s.feedback
              FROM worksheets w
              INNER JOIN materials m ON w.material_id = m.id
              INNER JOIN group_materials gm ON m.id = gm.material_id
              INNER JOIN group_members gmb ON gm.group_id = gmb.group_id
              INNER JOIN \`groups\` g ON gm.group_id = g.id
              LEFT JOIN worksheet_submissions s ON w.id = s.worksheet_id AND s.user_id = ?
              WHERE gmb.user_id = ?)
             ORDER BY created_at DESC`,
            { replacements: [userId, userId, userId, userId], type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, message: "Lấy danh sách phiếu học tập thành công", data: worksheets, errorCode: null });
    } catch (error) {
        console.error('getWorksheetsForStudent error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách phiếu học tập', data: null, errorCode: "GET_WORKSHEETS_FAILED" });
        }
};

// Lấy danh sách các lớp học mà Giáo viên để quản lý
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
        res.status(200).json({ success: true, message: "Lấy danh sách lớp học thành công", data: groups, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp học', data: null, errorCode: "GET_TEACHER_GROUPS_FAILED" });
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
        res.status(200).json({ success: true, message: "Lấy danh sách lớp học thành công", data: groups, errorCode: null });
    } catch (error) {
        console.error('Get Student Groups Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp học của học sinh', data: null, errorCode: "GET_STUDENT_GROUPS_FAILED" });
        }
};

// Thêm danh sách học sinh vào lớp học (Sử dụng INSERT IGNORE để trợnh trùng lặp)
exports.addGroupMembers = async (req, res) => {
    try {
        const { group_id, user_ids } = req.body; // user_ids là mảng [1, 2, 3]

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách học sinh không hợp lệ', data: null, errorCode: "INVALID_MEMBER_IDS" });
        }

        const [groupRows] = await sequelize.query(
            'SELECT capacity FROM `groups` WHERE id = ?',
            { replacements: [group_id], type: QueryTypes.SELECT }
        );

        if (!groupRows) {
            return res.status(404).json({ success: false, message: 'L??p học không tồn tại', data: null, errorCode: "GROUP_NOT_FOUND" });
        }

        const [{ currentCount }] = await sequelize.query(
            'SELECT COUNT(*) as currentCount FROM group_members WHERE group_id = ?',
            { replacements: [group_id], type: QueryTypes.SELECT }
        );

        if (currentCount + user_ids.length > groupRows.capacity) {
            return res.status(400).json({ success: false, message: `Không thể thêm. L??p học đã đạt tối đa ${groupRows.capacity} học sinh`, data: null, errorCode: "GROUP_CAPACITY_EXCEEDED" });
        }

        const values = user_ids.map(uid => `(${group_id}, ${uid})`).join(',');
        await sequelize.query(
            `INSERT IGNORE INTO group_members (group_id, user_id) VALUES ${values}`,
            { type: QueryTypes.INSERT }
        );

        res.status(200).json({ success: true, message: 'Đã thêm học sinh vào lớp', data: null, errorCode: null });
    } catch (error) {
        console.error("Add Group Members Error:", error);
        res.status(500).json({ success: false, message: 'Không thể thêm học sinh', data: null, errorCode: "ADD_MEMBERS_FAILED" });
        }
};

// Xóa học sinh kh??i lớp học
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
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm hoặc bạn không có quyền', data: null, errorCode: "GROUP_NOT_FOUND" });
        }

        await sequelize.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', {
            replacements: [groupId, studentId],
            type: QueryTypes.DELETE
        });

        res.status(200).json({ success: true, message: 'Đã xóa học sinh kh??i lớp', data: null, errorCode: null });
    } catch (error) {
        console.error('Remove Member Error:', error);
        res.status(500).json({ success: false, message: 'Không thể xóa học sinh', data: null, errorCode: "REMOVE_MEMBER_FAILED" });
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

        res.status(200).json({ success: true, message: 'Đã giao bài cho lớp', data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể giao bài học', data: null, errorCode: "ASSIGN_MATERIAL_FAILED" });
        }
};

// Lấy thông tin chi tiết một lớp học: Tên lớp, Danh sách học sinh, Danh sách bài học đã giao
exports.getGroupDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy thông tin cơ bản của lớp
        const group = await sequelize.query('SELECT * FROM `groups` WHERE id = ?', { replacements: [id], type: QueryTypes.SELECT });
        
        if (!group[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp', data: null, errorCode: "GROUP_NOT_FOUND" });
        if (!group[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy lớp', data: null, errorCode: "GROUP_NOT_FOUND" });

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
            success: true,
            message: "Lấy chi tiết lớp học thành công",
            data: { ...group[0], students, materials },
            errorCode: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết lớp học', data: null, errorCode: "GET_GROUP_DETAILS_FAILED" });
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
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm hoặc bạn không có quyền xóa', data: null, errorCode: "GROUP_NOT_FOUND" });
        }

        await sequelize.query('DELETE FROM `groups` WHERE id = ?', { 
            replacements: [id], 
            type: QueryTypes.DELETE
        });

        res.status(200).json({ success: true, message: 'Đã xóa nhóm thành công', data: null, errorCode: null });
    } catch (error) {
        console.error('Delete Group Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa nhóm học tập', data: null, errorCode: "DELETE_GROUP_FAILED" });
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
        res.status(200).json({ success: true, message: "Lấy danh sách học sinh thành công", data: students, errorCode: null });
    } catch (error) {
        console.error('Get Students Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách học sinh', data: null, errorCode: "GET_STUDENTS_FAILED" });
        }
};

// Lấy danh sách toàn bộ phiếu học tập do giáo viên tạo
exports.getAllWorksheetsForTeacher = async (req, res) => {
    try {
        const teacherId = req.user.id; 
        const worksheets = await sequelize.query(
            `SELECT w.*, GROUP_CONCAT(gw.group_id) as assignedTo 
             FROM worksheets w
             LEFT JOIN group_worksheets gw ON w.id = gw.worksheet_id
             WHERE w.created_by = ? 
             GROUP BY w.id
             ORDER BY w.created_at DESC`,
            { replacements: [teacherId], type: QueryTypes.SELECT }
        );

        // Chuyển độá¢â‚¬¢i assignedTo từ chulỗii "1,2,3" thành mảng [1, 2, 3]
        const formattedWorksheets = worksheets.map(ws => ({
            ...ws,
            assignedTo: ws.assignedTo ? ws.assignedTo.split(',').map(Number) : []
        }));

        res.status(200).json({ success: true, message: "Lấy danh sách phiếu học tập thành công", data: formattedWorksheets, errorCode: null });
    } catch (error) {
        console.error('getAllWorksheetsForTeacher error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách phiếu học tập', data: null, errorCode: "GET_WORKSHEETS_FAILED" });
        }
};

/**
 * 13. PHIấ¾U H??C TẬP (WORKSHEETS) - Tờ° Độá‹Å“NG SINH Bấ°NG AI
 */
// Hàm g??i AI để sinh ra một Phiếu học tập gồm các câu h??i tự luận và bài tập từ nội dung học liệu
exports.generateWorksheetWithAI = async (req, res) => {
    try {
        const { material_id, title } = req.body;

        // Lấy nội dung học liệu từ DB để cung cấp context cho AI
        const material = await sequelize.query(
            'SELECT * FROM materials WHERE id = ?',
            { replacements: [material_id], type: QueryTypes.SELECT }
        );

        if (!material[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy học liệu', data: null, errorCode: "MATERIAL_NOT_FOUND" });

        // Prompt yêu cầu AI đóng vai giáo viên để tạo câu h??i tự luận
        const prompt = `Bạn là một giáo viên chuyên nghiệp. Dựa vào nội dung tài liệu sau, hãy tạo một "Phiếu học tập" gồm 5 câu h??i tự luận giúp học sinh đào sâu kiến thức.
        Nội dung: ${material[0].content.substring(0, 4000)}
        
        Vui lòng trả về kết quả theo cấu trúc JSON:
                {
           "title": "Tên phiếu học tập",
           "questions": [
              {"id": 1, "question": "Câu h??i 1...", "hint": "Gợi ý trả lời..."},
              ...
           ]
        }
        Lưu ý: Ch?? trả về JSON, không kèm vá€á†â€™n bản khác.`;

        let aiResult = await aiService.generateContent(prompt);
        // Trích xuất JSON từ phản hồi của AI (phòng trườngng hợp AI thêm vá€á†â€™n bản th?a)
        const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI không trả về định dạng JSON hợp lệ.");
        }
        
        let parsedContent;
    try {
            parsedContent = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.warn('[AI_FALLBACK] generateWorksheetWithAI JSON parse failed:', parseError.message);
            throw parseError;
        }

        // Lưu thông tin phiếu học tập đã sinh vào Database
        const [worksheetId] = await sequelize.query(
            'INSERT INTO worksheets (material_id, title, content, created_by) VALUES (?, ?, ?, ?)',
                {
                replacements: [material_id, title || parsedContent.title, JSON.stringify(parsedContent.questions), req.user.id],
                    type: QueryTypes.INSERT
        }
        );

        res.status(201).json({
            success: true,
            message: "Phiếu học tập đã đá€ °ợc tạo thành công",
            data: { id: worksheetId, title: title || parsedContent.title, questions: parsedContent.questions },
            errorCode: null
        });
    } catch (error) {
        console.error('Generate Worksheet Error:', error);
        res.status(500).json({ success: false, message: 'AI hiện không thể sinh phiếu học tập', data: null, errorCode: "GENERATE_WORKSHEET_FAILED" });
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

        res.status(200).json({ success: true, message: 'Đã nnộip phiếu học tập thành công', data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể nnộip bài', data: null, errorCode: "SUBMIT_WORKSHEET_FAILED" });
        }
};

// Lấy danh sách phiếu học tập dành cho học sinh (Dựa vào các lớp mà học sinh tham gia)
exports.getWorksheetsForStudent = async (req, res) => {
    try {
        const userId = req.user.id; 

        // Sử dụng UNION để lấy cả phiếu đá€ °ợc gán trực tiếp và phiếu qua Material
        const worksheets = await sequelize.query(
            `(SELECT w.*, g.name as group_name, m.title as material_title, s.id as submission_id, s.score, s.feedback FROM worksheets w LEFT JOIN materials m ON w.material_id = m.id INNER JOIN group_worksheets gw ON w.id = gw.worksheet_id INNER JOIN group_members gmb ON gw.group_id = gmb.group_id INNER JOIN \`groups\` g ON gw.group_id = g.id LEFT JOIN worksheet_submissions s ON w.id = s.worksheet_id AND s.user_id = ? WHERE gmb.user_id = ?) UNION (SELECT w.*, g.name as group_name, m.title as material_title, s.id as submission_id, s.score, s.feedback FROM worksheets w INNER JOIN materials m ON w.material_id = m.id INNER JOIN group_materials gm ON m.id = gm.material_id INNER JOIN group_members gmb ON gm.group_id = gmb.group_id INNER JOIN \`groups\` g ON gm.group_id = g.id LEFT JOIN worksheet_submissions s ON w.id = s.worksheet_id AND s.user_id = ? WHERE gmb.user_id = ?) ORDER BY created_at DESC`,
            { replacements: [userId, userId, userId, userId], type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, message: "Lấy danh sách phiếu học tập thành công", data: worksheets, errorCode: null });
    } catch (error) {
        console.error('getWorksheetsForStudent error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách phiếu học tập', data: null, errorCode: "GET_WORKSHEETS_FAILED" });
        }
};

// Tạo phiếu học tập thủ công (từ WorksheetBuilder)
exports.createWorksheet = async (req, res) => {
    try {
        const { title, material_id, content } = req.body;
        const teacherId = req.user.id; 

        const [worksheetId] = await sequelize.query(
            'INSERT INTO worksheets (title, material_id, content, created_by) VALUES (?, ?, ?, ?)',
                {
                replacements: [title, material_id || null, JSON.stringify(content), teacherId],
                    type: QueryTypes.INSERT
        }
        );

        res.status(201).json({
            success: true,
            message: "Phiếu học tập đã đá€ °ợc tạo thành công",
            data: { id: worksheetId },
            errorCode: null
        });
    } catch (error) {
        console.error('createWorksheet error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo phiếu học tập', data: null, errorCode: "CREATE_WORKSHEET_FAILED" });
        }
};

// Cập nhật phiếu học tập
exports.updateWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const teacherId = req.user.id; 

        // Kiơm tra quyền sộá…¸ hữu
        const worksheet = await sequelize.query(
            'SELECT id FROM worksheets WHERE id = ? AND created_by = ?',
            { replacements: [id, teacherId], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu học tập hoặc bạn không có quyền', data: null, errorCode: "WORKSHEET_NOT_FOUND" });
        }

        await sequelize.query(
            'UPDATE worksheets SET title = ?, content = ? WHERE id = ?',
                {
                replacements: [title, JSON.stringify(content), id],
                type: QueryTypes.UPDATE
        }
        );

        res.status(200).json({ success: true, message: 'Đã cập nhật phiếu học tập thành công', data: null, errorCode: null });
    } catch (error) {
        console.error('updateWorksheet error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật phiếu học tập', data: null, errorCode: "UPDATE_WORKSHEET_FAILED" });
        }
};

// Gán phiếu học tập cho các nhóm
exports.assignWorksheetToGroups = async (req, res) => {
    try {
        const { worksheet_id, group_ids } = req.body; 
        const teacherId = req.user.id; 

        // Kiơm tra quyền sộá…¸ hữu
        const worksheet = await sequelize.query(
            'SELECT id FROM worksheets WHERE id = ? AND created_by = ?',
            { replacements: [worksheet_id, teacherId], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu học tập', data: null, errorCode: "WORKSHEET_NOT_FOUND" });
        }

        // Xóa các gán nhóm cũ
        await sequelize.query(
            'DELETE FROM group_worksheets WHERE worksheet_id = ?',
            { replacements: [worksheet_id], type: QueryTypes.DELETE }
        );

        // Chèn các gán nhóm mới
        if (group_ids && group_ids.length > 0) {
            // Sequelize raw query insert multiple rows
            const values = group_ids.map(gid => `(${gid}, ${worksheet_id})`).join(',');
        await sequelize.query(
                `INSERT INTO group_worksheets (group_id, worksheet_id) VALUES ${values}`,
                { type: QueryTypes.INSERT }
        );
        }

        res.status(200).json({ success: true, message: 'Đã gán phiếu học tập cho nhóm thành công', data: null, errorCode: null });
    } catch (error) {
        console.error('assignWorksheetToGroups error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi gán phiếu học tập', data: null, errorCode: "ASSIGN_WORKSHEET_FAILED" });
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

        if (!worksheet[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu học tập', data: null, errorCode: "WORKSHEET_NOT_FOUND" });

        res.status(200).json({ success: true, message: "Lấy phiếu học tập thành công", data: worksheet[0], errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin phiếu học tập', data: null, errorCode: "GET_WORKSHEET_FAILED" });
        }
};

// Xóa phiếu học tập
exports.deleteWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id; 

        // Kiơm tra quyền sộá…¸ hữu
        const worksheet = await sequelize.query(
            'SELECT * FROM worksheets WHERE id = ? AND created_by = ?',
            { replacements: [id, teacherId], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu học tập hoặc bạn không có quyền xóa', data: null, errorCode: "WORKSHEET_NOT_FOUND" });
        }

        await sequelize.query('DELETE FROM worksheets WHERE id = ?', {
            replacements: [id],
            type: QueryTypes.DELETE
        });

        res.status(200).json({ success: true, message: 'Đã xóa phiếu học tập thành công', data: null, errorCode: null });
    } catch (error) {
        console.error('Delete Worksheet Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa phiếu học tập', data: null, errorCode: "DELETE_WORKSHEET_FAILED" });
        }
};


exports.getWorksheetsByMaterial = async (req, res) => {
    try {
        const { material_id } = req.params;
        const worksheets = await sequelize.query(
            'SELECT * FROM worksheets WHERE material_id = ? ORDER BY created_at DESC',
            { replacements: [material_id], type: QueryTypes.SELECT }
        );
        res.status(200).json({ success: true, message: "Thao tác thành công", data: worksheets, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống', data: null, errorCode: "GET_WORKSHEETS_FAILED" });
        }
};

// --- NEW: Quản lý bài nộp (Submissions) ---

// Lấy dữ liệu
exports.getWorksheetSubmissions = async (req, res) => {
    try {
        const { worksheet_id } = req.params;
        const teacherId = req.user.id; 

        // Kiểm tra quyờn sở hữu phiếu
        const worksheet = await sequelize.query(
            'SELECT id FROM worksheets WHERE id = ? AND created_by = ?',
            { replacements: [worksheet_id, teacherId], type: QueryTypes.SELECT }
        );

        if (!worksheet[0]) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyờn xem bài nộp của phiếu này', data: null, errorCode: "FORBIDDEN" });
        }

        const submissions = await sequelize.query(
            `SELECT s.*, u.name as student_name, u.email as student_email 
             FROM worksheet_submissions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE s.worksheet_id = ?
             ORDER BY s.submitted_at DESC`,
            { replacements: [worksheet_id], type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('getWorksheetSubmissions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
        }
};

// Cập nhật nhận xét và điểm số cho bài nộp
exports.updateSubmissionFeedback = async (req, res) => {
    try {
        const { submission_id } = req.params;
        const { score, feedback } = req.body;

        // Cập nhật điểm và nhận xét
        const [updated] = await sequelize.query(
            "UPDATE worksheet_submissions SET score = ?, feedback = ? WHERE id = ?",
            { replacements: [score, feedback, submission_id], type: QueryTypes.UPDATE }
        );

        res.status(200).json({ success: true, message: "Cập nhật nhận xét thành công", data: { id: submission_id } });
    } catch (error) {
        console.error('updateSubmissionFeedback error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nhận xét' });
        }
};



exports.getMySubmissionForWorksheet = async (req, res) => {
    try {
        const { id: worksheetId } = req.params;
        const userId = req.user.id; 

        const submissions = await sequelize.query(
            "SELECT * FROM worksheet_submissions WHERE worksheet_id = ? AND user_id = ? LIMIT 1",
            { replacements: [worksheetId, userId], type: QueryTypes.SELECT }
        );

        res.status(200).json({ success: true, data: submissions[0] || null });
    } catch (error) {
        console.error("getMySubmissionForWorksheet error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin bài nộp" });
        }
};

