const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * GET /api/admin/stats
 * Tổng quan hệ thống: số user theo role, quiz, materials, learning sessions hôm nay
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Tổng số user theo role
        const userStats = await sequelize.query(`
            SELECT
                COUNT(*) AS total_users,
                SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) AS total_students,
                SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) AS total_teachers,
                SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) AS total_admins
            FROM users
        `, { type: QueryTypes.SELECT });

        // Tổng quiz
        const quizStats = await sequelize.query(`
            SELECT COUNT(*) AS total_quizzes FROM quizzes
        `, { type: QueryTypes.SELECT });

        // Tổng học liệu
        const materialStats = await sequelize.query(`
            SELECT COUNT(*) AS total_materials FROM materials
        `, { type: QueryTypes.SELECT });

        // Lượt làm bài hôm nay (learning_history với action = 'quiz_submit' hoặc tất cả)
        const todayStats = await sequelize.query(`
            SELECT COUNT(*) AS today_sessions
            FROM learning_history
            WHERE DATE(created_at) = CURDATE()
        `, { type: QueryTypes.SELECT });

        // Hôm qua để tính delta
        const yesterdayStats = await sequelize.query(`
            SELECT COUNT(*) AS yesterday_sessions
            FROM learning_history
            WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        `, { type: QueryTypes.SELECT });

        res.json({
            success: true,
            message: 'Lấy thống kê hệ thống thành công',
            data: {
                users: userStats[0],
                quizzes: quizStats[0],
                materials: materialStats[0],
                today_sessions: todayStats[0]?.today_sessions || 0,
                yesterday_sessions: yesterdayStats[0]?.yesterday_sessions || 0,
            },
            errorCode: null
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê hệ thống', data: null, errorCode: 'GET_DASHBOARD_STATS_FAILED' });
    }
};

/**
 * GET /api/admin/users
 * Danh sách toàn bộ user kèm số bài đã làm
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await sequelize.query(`
            SELECT
                u.id,
                u.name,
                u.email,
                u.role_id,
                u.created_at,
                COALESCE(lh.session_count, 0) AS quiz_count
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS session_count
                FROM learning_history
                GROUP BY user_id
            ) lh ON lh.user_id = u.id
            ORDER BY u.created_at DESC
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy danh sách người dùng thành công', data: users, errorCode: null });
    } catch (error) {
        console.error('getAllUsers error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách người dùng', data: null, errorCode: 'GET_ALL_USERS_FAILED' });
    }
};

/**
 * GET /api/admin/top-quizzes
 * Top quiz/subject theo số lượt làm
 */
exports.getTopQuizzes = async (req, res) => {
    try {
        // Thử lấy từ learning_history group by quiz_id, join quizzes
        const topQuizzes = await sequelize.query(`
            SELECT
                q.id,
                q.title,
                q.subject,
                COUNT(lh.id) AS attempt_count
            FROM quizzes q
            LEFT JOIN learning_history lh ON lh.quiz_id = q.id
            GROUP BY q.id, q.title, q.subject
            ORDER BY attempt_count DESC
            LIMIT 5
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy top quiz thành công', data: topQuizzes, errorCode: null });
    } catch (error) {
        console.error('getTopQuizzes error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy top quiz', data: null, errorCode: 'GET_TOP_QUIZZES_FAILED' });
    }
};

/**
 * GET /api/admin/subject-stats
 * Thống kê theo subject/chủ đề
 */
exports.getSubjectStats = async (req, res) => {
    try {
        const stats = await sequelize.query(`
            SELECT
                COALESCE(q.subject, 'Khác') AS subject,
                COUNT(DISTINCT q.id)         AS quiz_count,
                COUNT(lh.id)                 AS attempt_count
            FROM quizzes q
            LEFT JOIN learning_history lh ON lh.quiz_id = q.id
            GROUP BY q.subject
            ORDER BY attempt_count DESC
            LIMIT 5
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy thống kê chủ đề thành công', data: stats, errorCode: null });
    } catch (error) {
        console.error('getSubjectStats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê chủ đề', data: null, errorCode: 'GET_SUBJECT_STATS_FAILED' });
    }
};

/**
 * GET /api/admin/activity
 * Lấy hoạt động theo thời gian thực từ nhiều bảng
 */
exports.getRecentActivity = async (req, res) => {
    try {
        const activities = await sequelize.query(`
            SELECT 
                'user' AS type, 
                name AS actor, 
                'vừa tạo tài khoản mới' AS action_text, 
                created_at 
            FROM users

            UNION ALL

            SELECT 
                'material' AS type, 
                u.name AS actor, 
                CONCAT('vừa tải lên học liệu "', m.title, '"') AS action_text, 
                m.created_at 
            FROM materials m
            JOIN users u ON m.created_by = u.id

            UNION ALL

            SELECT 
                'quiz' AS type, 
                u.name AS actor, 
                CONCAT('vừa tạo quiz "', q.title, '"') AS action_text, 
                q.created_at 
            FROM quizzes q
            JOIN users u ON q.created_by = u.id

            UNION ALL

            SELECT 
                'learning' AS type, 
                u.name AS actor, 
                lh.action AS action_text, 
                lh.created_at 
            FROM learning_history lh
            JOIN users u ON lh.user_id = u.id
            WHERE lh.action LIKE '%hoàn thành%' OR lh.action LIKE '%nộp%' OR lh.action LIKE '%submit%'

            ORDER BY created_at DESC
            LIMIT 15
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy hoạt động gần đây thành công', data: activities, errorCode: null });
    } catch (error) {
        console.error('getRecentActivity error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy hoạt động gần đây', data: null, errorCode: 'GET_RECENT_ACTIVITY_FAILED' });
    }
};

/**
 * GET /api/admin/quizzes
 * Danh sách toàn bộ quiz kèm tên người tạo và số câu hỏi
 */
exports.getAllQuizzesAdmin = async (req, res) => {
    try {
        const quizzes = await sequelize.query(`
            SELECT
                q.id,
                q.title,
                q.subject,
                q.created_at,
                u.name AS creator_name,
                COUNT(qu.id) AS question_count,
                COALESCE(lh.attempt_count, 0) AS attempt_count
            FROM quizzes q
            LEFT JOIN users u ON q.created_by = u.id
            LEFT JOIN questions qu ON qu.quiz_id = q.id
            LEFT JOIN (
                SELECT quiz_id, COUNT(*) AS attempt_count
                FROM learning_history
                WHERE quiz_id IS NOT NULL
                GROUP BY quiz_id
            ) lh ON lh.quiz_id = q.id
            GROUP BY q.id, q.title, q.subject, q.created_at, u.name, lh.attempt_count
            ORDER BY q.created_at DESC
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy danh sách quiz thành công', data: quizzes, errorCode: null });
    } catch (error) {
        console.error('getAllQuizzesAdmin error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách quiz', data: null, errorCode: 'GET_ALL_QUIZZES_FAILED' });
    }
};

/**
 * GET /api/admin/materials
 * Danh sách toàn bộ học liệu kèm tên người tạo và lượt xem
 */
exports.getAllMaterialsAdmin = async (req, res) => {
    try {
        const materials = await sequelize.query(`
            SELECT
                m.id,
                m.title,
                m.description,
                m.created_at,
                u.name AS creator_name,
                COALESCE(lh.view_count, 0) AS view_count
            FROM materials m
            LEFT JOIN users u ON m.created_by = u.id
            LEFT JOIN (
                SELECT material_id, COUNT(*) AS view_count
                FROM learning_history
                WHERE material_id IS NOT NULL AND action = 'VIEWED_MATERIAL'
                GROUP BY material_id
            ) lh ON lh.material_id = m.id
            ORDER BY m.created_at DESC
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, message: 'Lấy danh sách học liệu thành công', data: materials, errorCode: null });
    } catch (error) {
        console.error('getAllMaterialsAdmin error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách học liệu', data: null, errorCode: 'GET_ALL_MATERIALS_FAILED' });
    }
};

/**
 * DELETE /api/admin/materials/:id
 * Xoá học liệu (chỉ Admin)
 */
exports.deleteMaterialAdmin = async (req, res) => {
    try {
        const materialId = req.params.id;
        await sequelize.query('DELETE FROM materials WHERE id = ?', {
            replacements: [materialId],
            type: QueryTypes.DELETE
        });
        res.json({ success: true, message: 'Đã xoá học liệu', data: null, errorCode: null });
    } catch (error) {
        console.error('deleteMaterialAdmin error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xoá học liệu', data: null, errorCode: 'DELETE_MATERIAL_FAILED' });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Xoá user (chỉ Admin)
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await sequelize.query('DELETE FROM users WHERE id = ?', {
            replacements: [userId],
            type: QueryTypes.DELETE
        });
        res.json({ success: true, message: 'Đã xoá người dùng', data: null, errorCode: null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xoá người dùng', data: null, errorCode: 'DELETE_USER_FAILED' });
    }
};

/**
 * GET /api/admin/groups
 * Danh sách toàn bộ lớp học kèm sĩ số
 */
exports.getAllGroupsAdmin = async (req, res) => {
    try {
        const groups = await sequelize.query(`
            SELECT 
                g.id, g.name, g.description, g.color, g.capacity, g.created_at,
                u.name AS teacher_name,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS student_count
            FROM \`groups\` g
            JOIN users u ON g.teacher_id = u.id
            ORDER BY g.created_at DESC
        `, { type: QueryTypes.SELECT });
        res.json({ success: true, message: 'Lấy danh sách lớp học thành công', data: groups, errorCode: null });
    } catch (error) {
        console.error('getAllGroupsAdmin error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lớp học', data: null, errorCode: 'GET_ALL_GROUPS_FAILED' });
    }
};

/**
 * PUT /api/admin/groups/:id/capacity
 * Cập nhật sĩ số tối đa của lớp học
 */
exports.updateGroupCapacity = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { capacity } = req.body;

        if (!capacity || isNaN(capacity) || capacity <= 0) {
            return res.status(400).json({ success: false, message: 'Sĩ số không hợp lệ', data: null, errorCode: 'INVALID_CAPACITY' });
        }

        await sequelize.query('UPDATE \`groups\` SET capacity = ? WHERE id = ?', {
            replacements: [capacity, groupId],
            type: QueryTypes.UPDATE
        });

        res.json({ success: true, message: 'Đã cập nhật sĩ số lớp học', data: null, errorCode: null });
    } catch (error) {
        console.error('updateGroupCapacity error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật sĩ số', data: null, errorCode: 'UPDATE_GROUP_CAPACITY_FAILED' });
    }
};
