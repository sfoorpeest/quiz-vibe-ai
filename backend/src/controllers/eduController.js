const { sequelize } = require('../config/database');
const aiService = require('../services/aiService');
const { QueryTypes } = require('sequelize');

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
 * 2. Tạo học liệu mới
 */
exports.createMaterial = async (req, res) => {
    try {
        const { title, description, content_url, content } = req.body;
        const teacherId = req.user.id; 

        // SỬA: Thêm trường 'content' vào câu lệnh INSERT và dùng sequelize.query
        const [resultId] = await sequelize.query(
            'INSERT INTO materials (title, description, content_url, content, created_by) VALUES (?, ?, ?, ?, ?)',
                {
                    replacements: [title, description, content_url, content, teacherId],
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
        // SỬA: Dùng sequelize.query
        const rows = await sequelize.query(
            'SELECT * FROM materials ORDER BY created_at DESC',
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách học liệu" });
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