const User = require('../models/User');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// --- LẤY THÔNG TIN PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await sequelize.query(
            "SELECT * FROM users WHERE id = :userId",
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // --- SMART FALLBACK: Nếu DB chưa có avatar_url, tìm trong folder ---
        let currentAvatar = user.avatar_url;
        if (!currentAvatar) {
            try {
                const avatarDir = path.join(__dirname, '../../uploads/avatars');
                if (fs.existsSync(avatarDir)) {
                    const files = fs.readdirSync(avatarDir);
                    // Tìm file mới nhất có dạng avatar_{userId}_
                    const userFiles = files
                        .filter(f => f.startsWith(`avatar_${userId}_`))
                        .sort((a, b) => b.localeCompare(a)); // Sắp xếp giảm dần để lấy cái mới nhất (theo timestamp)
                    
                    if (userFiles.length > 0) {
                        currentAvatar = `/uploads/avatars/${userFiles[0]}`;
                    }
                }
            } catch (e) {
                console.error("Smart Fallback Error:", e);
            }
        }

        res.json({
            id: user.id,
            name: user.name,
            username: user.username || user.name, 
            email: user.email,
            role_id: user.role_id,
            phone: user.phone || '',
            birthDate: user.birth_date || '',
            gender: user.gender || '',
            address: user.address || '',
            bio: user.bio || '',
            avatar: currentAvatar || null,
            notificationEmail: user.notification_email ? true : false,
            notificationLearning: user.notification_learning ? true : false,
            isProfilePrivate: user.is_profile_private ? true : false,
            created_at: user.created_at,
        });
    } catch (error) {
        console.error('Profile getProfile Error:', error);
        res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
    }
};

// --- CẬP NHẬT PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Map FE fields to DB fields
        const fieldMap = {
            'name': 'name',
            'phone': 'phone',
            'birthDate': 'birth_date',
            'gender': 'gender',
            'address': 'address',
            'bio': 'bio',
            'notificationEmail': 'notification_email',
            'notificationLearning': 'notification_learning',
            'isProfilePrivate': 'is_profile_private'
        };

        Object.keys(fieldMap).forEach(feField => {
            if (req.body[feField] !== undefined && user[fieldMap[feField]] !== undefined) {
                user[fieldMap[feField]] = req.body[feField];
            }
        });

        await user.save();

        res.json({
            id: user.id,
            name: user.name,
            username: user.username || user.name,
            email: user.email,
            role_id: user.role_id,
            phone: user.phone || '',
            birthDate: user.birth_date || '',
            gender: user.gender || '',
            address: user.address || '',
            bio: user.bio || '',
            avatar: user.avatar_url || null,
            notificationEmail: Boolean(user.notification_email),
            notificationLearning: Boolean(user.notification_learning),
            isProfilePrivate: Boolean(user.is_profile_private),
            created_at: user.created_at,
        });
    } catch (error) {
        console.error('Profile updateProfile Error:', error);
        res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
    }
};

// --- UPLOAD AVATAR ---
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Chưa chọn ảnh đại diện." });
        }

        // Chỉ lưu nếu cột tồn tại trong Model (hiện tại tôi đã tạm gỡ để tránh crash, nên tôi sẽ dùng raw query ở đây để cứu vãn)
        await sequelize.query(
            "UPDATE users SET avatar_url = :avatarPath WHERE id = :userId",
            {
                replacements: { avatarPath: `/uploads/avatars/${req.file.filename}`, userId },
                type: QueryTypes.UPDATE
            }
        );

        // Fetch lại data sạch
        const [updatedUser] = await sequelize.query(
            "SELECT * FROM users WHERE id = :userId",
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            username: updatedUser.username || updatedUser.name,
            email: updatedUser.email,
            role_id: updatedUser.role_id,
            phone: updatedUser.phone || '',
            birthDate: updatedUser.birth_date || '',
            gender: updatedUser.gender || '',
            address: updatedUser.address || '',
            bio: updatedUser.bio || '',
            avatar: updatedUser.avatar_url || null,
            notificationEmail: updatedUser.notification_email ? true : false,
            notificationLearning: updatedUser.notification_learning ? true : false,
            isProfilePrivate: updatedUser.is_profile_private ? true : false,
            created_at: updatedUser.created_at,
        });
    } catch (error) {
        console.error('Profile uploadAvatar Error:', error);
        res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
    }
};

// --- LỊCH SỬ HOẠT ĐỘNG ---
exports.getActivity = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy lịch sử học tập từ bảng learning_history (cùng bảng Home dùng)
        const activities = await sequelize.query(`
            SELECT 
                lh.id,
                lh.action,
                CASE 
                    WHEN lh.material_id IS NOT NULL THEN 'material'
                    WHEN lh.quiz_id IS NOT NULL THEN 'quiz'
                    ELSE 'other'
                END AS itemType,
                COALESCE(m.title, q.title) AS title,
                q.subject AS subject,
                lh.progress,
                r.score AS score,
                lh.created_at AS date
            FROM learning_history lh
            LEFT JOIN materials m ON lh.material_id = m.id
            LEFT JOIN quizzes q ON lh.quiz_id = q.id
            LEFT JOIN results r ON r.user_id = lh.user_id AND r.quiz_id = lh.quiz_id
            WHERE lh.user_id = :userId
            ORDER BY lh.created_at DESC
            LIMIT 20
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        res.json(activities);
    } catch (error) {
        console.error('Profile getActivity Error:', error);
        res.json([]);
    }
};

// --- DASHBOARD SUMMARY ---
exports.getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        let stats = {};

        if (user.role_id === 2 || user.role_id === 3) {
            // Teacher / Admin — dùng đúng bảng materials (như Home)
            const [matCount] = await sequelize.query(
                `SELECT COUNT(*) as total FROM materials WHERE created_by = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            const [quizCount] = await sequelize.query(
                `SELECT COUNT(*) as total FROM quizzes WHERE created_by = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            const [interactCount] = await sequelize.query(
                `SELECT COUNT(lh.id) as total 
                 FROM learning_history lh
                 LEFT JOIN materials m ON lh.material_id = m.id
                 LEFT JOIN quizzes q ON lh.quiz_id = q.id
                 WHERE m.created_by = :userId OR q.created_by = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            stats = {
                totalMaterials: Number(matCount?.total || 0),
                totalQuizzes: Number(quizCount?.total || 0),
                totalInteractions: Number(interactCount?.total || 0),
            };
        } else {
            // Student — dùng đúng bảng learning_history + results (như Home)
            const [learnedCount] = await sequelize.query(
                `SELECT COUNT(DISTINCT material_id) as total 
                 FROM learning_history 
                 WHERE user_id = :userId AND (action = 'VIEWED_MATERIAL' OR action = 'COMPLETED_QUIZ')`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            const [avgScore] = await sequelize.query(
                `SELECT AVG(score) as avg FROM results WHERE user_id = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );
            stats = {
                totalLearned: Number(learnedCount?.total || 0),
                avgScore: avgScore?.avg ? parseFloat(avgScore.avg).toFixed(1) : 0,
            };
        }

        // Bài học đang xem dở gần nhất (đúng query của Home)
        let lastMaterial = null;
        try {
            const [mat] = await sequelize.query(`
                SELECT m.id, m.title, m.description, lh.progress
                FROM learning_history lh
                JOIN materials m ON lh.material_id = m.id
                WHERE lh.user_id = :userId AND lh.action = 'VIEWED_MATERIAL'
                ORDER BY lh.created_at DESC LIMIT 1
            `, { replacements: { userId }, type: QueryTypes.SELECT });
            if (mat) {
                lastMaterial = mat;
            }
        } catch (e) { }

        res.json({ stats, lastMaterial });
    } catch (error) {
        console.error('Profile getDashboardSummary Error:', error);
        res.json({ stats: {}, lastMaterial: null });
    }
};

