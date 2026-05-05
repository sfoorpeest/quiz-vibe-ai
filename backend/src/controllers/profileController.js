const User = require('../models/User');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { supabase } = require('../config/supabase');
const { getMaterialLearningSnapshot } = require('../services/materialService');

const sendProfileError = (res, statusCode, message, error) => res.status(statusCode).json({
    success: false,
    message,
    error: error ? String(error.message || error) : null,
});

const ALLOWED_ITEM_TYPES = new Set(['material', 'assignment']);

const normalizeItemType = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    return ALLOWED_ITEM_TYPES.has(normalized) ? normalized : null;
};

const normalizeItemId = (value) => {
    const normalized = String(value || '').trim();
    return normalized ? normalized : null;
};

const upsertUserItemAction = async (userId, itemType, itemId, updates) => {
    const [existing] = await sequelize.query(
        `SELECT is_saved, is_favorite
         FROM user_item_actions
         WHERE user_id = :userId
           AND item_type = :itemType
           AND item_id = :itemId
         LIMIT 1`,
        {
            replacements: { userId, itemType, itemId },
            type: QueryTypes.SELECT
        }
    );

    const nextSaved = typeof updates.isSaved === 'boolean'
        ? updates.isSaved
        : Boolean(existing?.is_saved);
    const nextFavorite = typeof updates.isFavorite === 'boolean'
        ? updates.isFavorite
        : Boolean(existing?.is_favorite);

    await sequelize.query(
        `INSERT INTO user_item_actions
            (user_id, item_id, item_type, is_saved, is_favorite, created_at, updated_at)
         VALUES (:userId, :itemId, :itemType, :isSaved, :isFavorite, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            is_saved = VALUES(is_saved),
            is_favorite = VALUES(is_favorite),
            updated_at = NOW()`,
        {
            replacements: {
                userId,
                itemId,
                itemType,
                isSaved: nextSaved ? 1 : 0,
                isFavorite: nextFavorite ? 1 : 0,
            },
            type: QueryTypes.INSERT
        }
    );

    return {
        itemId,
        type: itemType,
        isSaved: nextSaved,
        isFavorite: nextFavorite,
    };
};

const buildItemTypeWhere = (itemType) => {
    const normalized = normalizeItemType(itemType);
    if (!normalized) {
        return {
            clause: '',
            replacements: {}
        };
    }

    return {
        clause: ' AND a.item_type = :itemType ',
        replacements: { itemType: normalized }
    };
};

// --- LẤY THÔNG TIN PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Join users với user_profiles và badges (cho equipped badge)
        const [profile] = await sequelize.query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.created_at,
                up.phone, up.birth_date AS birthDate, up.gender, up.address, up.bio, 
                up.avatar_url AS avatar, up.notification_email, up.notification_learning, up.is_profile_private,
                up.featured_badges, up.equipped_badge_id,
                b.tier AS equipped_badge_tier, b.icon_url AS equipped_badge_icon
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN badges b ON up.equipped_badge_id = b.id
            WHERE u.id = :userId
            LIMIT 1
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        if (!profile) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Nếu chưa có profile trong user_profiles, tạo mặc định (để các lần sau join có data)
        if (profile.phone === undefined) { 
            const checkProfile = await sequelize.query("SELECT user_id FROM user_profiles WHERE user_id = :userId", {
                replacements: { userId },
                type: QueryTypes.SELECT
            });

            if (checkProfile.length === 0) {
                await sequelize.query("INSERT INTO user_profiles (user_id) VALUES (:userId)", {
                    replacements: { userId },
                    type: QueryTypes.INSERT
                });
            }
        }

        // Find highest featured tier
        let highestFeaturedTier = null;
        const featuredIds = typeof profile.featured_badges === 'string' ? JSON.parse(profile.featured_badges) : (profile.featured_badges || []);
        if (featuredIds.length > 0) {
            const [highestBadge] = await sequelize.query(
                'SELECT tier FROM badges WHERE id IN (?) ORDER BY FIELD(tier, "BRONZE", "SILVER", "GOLD", "DIAMOND") DESC LIMIT 1',
                { replacements: [featuredIds], type: QueryTypes.SELECT }
            );
            if (highestBadge) highestFeaturedTier = highestBadge.tier;
        }

        res.json({
            ...profile,
            username: profile.name,
            avatar: profile.avatar || null,
            notificationEmail: Boolean(profile.notification_email),
            notificationLearning: Boolean(profile.notification_learning),
            isProfilePrivate: Boolean(profile.is_profile_private),
            featuredBadges: featuredIds,
            equippedBadgeId: profile.equipped_badge_id || null,
            equippedBadgeTier: profile.equipped_badge_tier || null,
            equippedBadgeIcon: profile.equipped_badge_icon || null,
            highestFeaturedTier: highestFeaturedTier
        });
    } catch (error) {
        console.error('Profile getProfile Error:', error);
        res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
    }
};

// --- CẬP NHẬT PROFILE ---
exports.updateProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const { name, phone, birthDate, gender, address, bio, notificationEmail, notificationLearning, isProfilePrivate } = req.body;

        // 1. Cập nhật bảng users (chỉ name)
        if (name) {
            await sequelize.query("UPDATE users SET name = :name WHERE id = :userId", {
                replacements: { name, userId },
                type: QueryTypes.UPDATE,
                transaction: t
            });
        }

        // 2. Cập nhật bảng user_profiles
        // Đảm bảo row tồn tại
        const [existing] = await sequelize.query("SELECT user_id FROM user_profiles WHERE user_id = :userId", {
            replacements: { userId },
            type: QueryTypes.SELECT,
            transaction: t
        });

        if (!existing) {
            await sequelize.query("INSERT INTO user_profiles (user_id) VALUES (:userId)", {
                replacements: { userId },
                type: QueryTypes.INSERT,
                transaction: t
            });
        }

        await sequelize.query(`
            UPDATE user_profiles SET 
                phone = :phone, 
                birth_date = :birthDate, 
                gender = :gender, 
                address = :address, 
                bio = :bio,
                notification_email = :notificationEmail,
                notification_learning = :notificationLearning,
                is_profile_private = :isProfilePrivate
            WHERE user_id = :userId
        `, {
            replacements: { 
                phone: phone || null, 
                birthDate: birthDate || null, 
                gender: gender || null, 
                address: address || null, 
                bio: bio || null,
                notificationEmail: notificationEmail !== undefined ? (notificationEmail ? 1 : 0) : 1,
                notificationLearning: notificationLearning !== undefined ? (notificationLearning ? 1 : 0) : 1,
                isProfilePrivate: isProfilePrivate !== undefined ? (isProfilePrivate ? 1 : 0) : 0,
                userId 
            },
            type: QueryTypes.UPDATE,
            transaction: t
        });

        await t.commit();

        // Trả về data mới bằng cách gọi getProfile logic (hoặc tương đương)
        const [updated] = await sequelize.query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.created_at,
                up.phone, up.birth_date AS birthDate, up.gender, up.address, up.bio, 
                up.avatar_url AS avatar, up.notification_email, up.notification_learning, up.is_profile_private,
                up.featured_badges, up.equipped_badge_id
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = :userId
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.json({
            ...updated,
            username: updated.name,
            avatar: updated.avatar || null,
            notificationEmail: Boolean(updated.notification_email),
            notificationLearning: Boolean(updated.notification_learning),
            isProfilePrivate: Boolean(updated.is_profile_private),
            featuredBadges: typeof updated.featured_badges === 'string' ? JSON.parse(updated.featured_badges) : (updated.featured_badges || []),
            equippedBadgeId: updated.equipped_badge_id || null
        });
    } catch (error) {
        await t.rollback();
        console.error('Profile updateProfile Error:', error);
        res.status(500).json({ message: "Lỗi máy chủ.", error: error.message });
    }
};

// --- UPLOAD AVATAR ---
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return sendProfileError(res, 400, 'Chưa chọn ảnh đại diện.', 'NO_FILE');
        }

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !supabase) {
            return sendProfileError(res, 503, 'Thiếu cấu hình Supabase cho upload avatar.', 'SUPABASE_CONFIG_MISSING');
        }

        const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
        };

        const ext = mimeToExt[req.file.mimetype];
        if (!ext) {
            return sendProfileError(res, 400, 'Định dạng ảnh không hợp lệ.', 'INVALID_IMAGE_TYPE');
        }

        const avatarObjectPath = `${userId}.${ext}`;

        // Đảm bảo row tồn tại trong user_profiles
        const [existing] = await sequelize.query("SELECT user_id, avatar_url FROM user_profiles WHERE user_id = :userId", {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Xóa avatar cũ trên Supabase nếu có
        if (existing?.avatar_url) {
            let oldObjectPath = null;

            try {
                const oldUrl = String(existing.avatar_url);
                if (oldUrl.includes('/storage/v1/object/public/avatars/')) {
                    oldObjectPath = decodeURIComponent(oldUrl.split('/storage/v1/object/public/avatars/')[1] || '').split('?')[0];
                } else if (!oldUrl.startsWith('/uploads/')) {
                    oldObjectPath = oldUrl;
                }
            } catch (e) {
                oldObjectPath = null;
            }

            if (oldObjectPath) {
                await supabase.storage.from('avatars').remove([oldObjectPath]);
            }
        }

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(avatarObjectPath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
            });

        if (uploadError) {
            return sendProfileError(res, 502, 'Upload avatar thất bại.', uploadError);
        }

        const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(avatarObjectPath);

        const avatarPath = publicData?.publicUrl || null;
        if (!avatarPath) {
            return sendProfileError(res, 502, 'Không thể tạo URL avatar.', 'PUBLIC_URL_FAILED');
        }

        if (!existing) {
            await sequelize.query("INSERT INTO user_profiles (user_id, avatar_url) VALUES (:userId, :avatarPath)", {
                replacements: { userId, avatarPath },
                type: QueryTypes.INSERT
            });
        } else {
            await sequelize.query(
                "UPDATE user_profiles SET avatar_url = :avatarPath WHERE user_id = :userId",
                {
                    replacements: { avatarPath, userId },
                    type: QueryTypes.UPDATE
                }
            );
        }

        // Fetch lại data sạch
        const [updated] = await sequelize.query(`
            SELECT 
                u.id, u.name, u.email, u.role_id, u.created_at,
                up.phone, up.birth_date AS birthDate, up.gender, up.address, up.bio, 
                up.avatar_url AS avatar, up.notification_email, up.notification_learning, up.is_profile_private,
                up.featured_badges, up.equipped_badge_id
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = :userId
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.json({
            ...updated,
            username: updated.name,
            avatar: updated.avatar || null,
            notificationEmail: Boolean(updated.notification_email),
            notificationLearning: Boolean(updated.notification_learning),
            isProfilePrivate: Boolean(updated.is_profile_private),
            featuredBadges: typeof updated.featured_badges === 'string' ? JSON.parse(updated.featured_badges) : (updated.featured_badges || []),
            equippedBadgeId: updated.equipped_badge_id || null
        });
    } catch (error) {
        console.error('Profile uploadAvatar Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.', error: error.message });
    }
};

// --- LỊCH SỬ HOẠT ĐỘNG ---
exports.getActivity = async (req, res) => {
    try {
        const userId = req.user.id;

        // Gộp lịch sử học tập + lịch sử làm quiz (từ results)
        const activities = await sequelize.query(`
            SELECT * FROM (
                SELECT
                    CONCAT('lh-', lh.id) AS id,
                    lh.action,
                    CASE
                        WHEN lh.material_id IS NOT NULL THEN 'material'
                        WHEN lh.quiz_id IS NOT NULL THEN 'quiz'
                        ELSE 'other'
                    END AS itemType,
                    COALESCE(m.title, q.title) AS title,
                    q.subject AS subject,
                    lh.progress,
                    NULL AS score,
                    lh.created_at AS createdAt,
                    lh.material_id AS materialId,
                    lh.quiz_id AS quizId
                FROM learning_history lh
                LEFT JOIN materials m ON lh.material_id = m.id
                LEFT JOIN quizzes q ON lh.quiz_id = q.id
                WHERE lh.user_id = :userId

                UNION ALL

                SELECT
                    CONCAT('rs-', r.id) AS id,
                    'QUIZ_ATTEMPT' AS action,
                    'quiz' AS itemType,
                    COALESCE(m.title, q.title, 'Bài kiểm tra') AS title,
                    q.subject AS subject,
                    NULL AS progress,
                    COALESCE(r.correct_count, ROUND(r.score), 0) AS score,
                    COALESCE(r.created_at, r.submitted_at) AS createdAt,
                    r.material_id AS materialId,
                    r.quiz_id AS quizId
                FROM results r
                LEFT JOIN quizzes q ON r.quiz_id = q.id
                LEFT JOIN materials m ON r.material_id = m.id
                WHERE r.user_id = :userId
            ) all_activities
            ORDER BY createdAt DESC
            LIMIT 100
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
            const [totalLessons] = await sequelize.query(
                `SELECT COUNT(*) as total FROM materials`,
                { type: QueryTypes.SELECT }
            );
                        const [completedLessons] = await sequelize.query(
                                `SELECT COUNT(DISTINCT r.material_id) as total
                                 FROM results r
                                 WHERE r.user_id = :userId
                                     AND r.material_id IS NOT NULL
                                     AND COALESCE(r.correct_count, ROUND(r.score), 0) >= 3
                                     AND EXISTS (
                                         SELECT 1
                                         FROM learning_history lh
                                         WHERE lh.user_id = r.user_id
                                             AND lh.material_id = r.material_id
                                             AND lh.action = 'VIEWED_MATERIAL'
                                             AND COALESCE(lh.progress, 0) >= 90
                                     )`,
                                { replacements: { userId }, type: QueryTypes.SELECT }
                        );
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
            const [completedQuizCount] = await sequelize.query(
                `SELECT COUNT(*) as total
                 FROM results
                 WHERE user_id = :userId`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );

            const totalLessonsNum = Number(totalLessons?.total || 0);
            const completedLessonsNum = Number(completedLessons?.total || 0);
            const completionPercentage = totalLessonsNum > 0
                ? Math.round((completedLessonsNum / totalLessonsNum) * 100)
                : 0;
            const completedQuizCountNum = Number(completedQuizCount?.total || 0);

            stats = {
                totalLearned: Number(learnedCount?.total || 0),
                avgScore: avgScore?.avg ? parseFloat(avgScore.avg).toFixed(1) : 0,
                totalLessons: totalLessonsNum,
                completedLessons: completedLessonsNum,
                completionPercentage,
                completedQuizCount: completedQuizCountNum,
                quizCompleted: completedQuizCountNum > 0,
            };
        }

        // Bài học đang xem dở gần nhất (đúng query của Home)
        let lastMaterial = null;
        try {
            const [latestMaterialActivity] = await sequelize.query(
                `SELECT activity.material_id, MAX(activity.activity_at) AS activity_at
                 FROM (
                     SELECT material_id, created_at AS activity_at
                     FROM learning_history
                     WHERE user_id = :userId
                       AND material_id IS NOT NULL
                       AND action = 'VIEWED_MATERIAL'

                     UNION ALL

                     SELECT material_id, COALESCE(created_at, submitted_at) AS activity_at
                     FROM results
                     WHERE user_id = :userId
                       AND material_id IS NOT NULL
                 ) activity
                 GROUP BY activity.material_id
                 ORDER BY activity_at DESC
                 LIMIT 1`,
                { replacements: { userId }, type: QueryTypes.SELECT }
            );

            if (latestMaterialActivity?.material_id) {
                const [materialRow] = await sequelize.query(
                    `SELECT id, title, description
                     FROM materials
                     WHERE id = :materialId
                     LIMIT 1`,
                    {
                        replacements: { materialId: latestMaterialActivity.material_id },
                        type: QueryTypes.SELECT
                    }
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
        } catch (e) { }

        res.json({ stats, lastMaterial });
    } catch (error) {
        console.error('Profile getDashboardSummary Error:', error);
        res.json({ stats: {}, lastMaterial: null });
    }
};

exports.saveItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemType = normalizeItemType(req.body?.type);
        const itemId = normalizeItemId(req.body?.itemId);

        if (!itemType || !itemId) {
            return res.status(400).json({ message: 'type và itemId là bắt buộc.' });
        }

        const data = await upsertUserItemAction(userId, itemType, itemId, { isSaved: true });
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Profile saveItem Error:', error);
        return res.status(500).json({ message: 'Không thể lưu mục.' });
    }
};

exports.unsaveItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemType = normalizeItemType(req.body?.type);
        const itemId = normalizeItemId(req.body?.itemId);

        if (!itemType || !itemId) {
            return res.status(400).json({ message: 'type và itemId là bắt buộc.' });
        }

        const data = await upsertUserItemAction(userId, itemType, itemId, { isSaved: false });
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Profile unsaveItem Error:', error);
        return res.status(500).json({ message: 'Không thể bỏ lưu mục.' });
    }
};

exports.favoriteItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemType = normalizeItemType(req.body?.type);
        const itemId = normalizeItemId(req.body?.itemId);

        if (!itemType || !itemId) {
            return res.status(400).json({ message: 'type và itemId là bắt buộc.' });
        }

        const data = await upsertUserItemAction(userId, itemType, itemId, { isFavorite: true });
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Profile favoriteItem Error:', error);
        return res.status(500).json({ message: 'Không thể thêm yêu thích.' });
    }
};

exports.unfavoriteItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemType = normalizeItemType(req.body?.type);
        const itemId = normalizeItemId(req.body?.itemId);

        if (!itemType || !itemId) {
            return res.status(400).json({ message: 'type và itemId là bắt buộc.' });
        }

        const data = await upsertUserItemAction(userId, itemType, itemId, { isFavorite: false });
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Profile unfavoriteItem Error:', error);
        return res.status(500).json({ message: 'Không thể bỏ yêu thích.' });
    }
};

exports.getSavedItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { clause, replacements } = buildItemTypeWhere(req.query?.type);
        const rows = await sequelize.query(
            `SELECT
                a.item_id AS itemId,
                a.item_type AS type,
                COALESCE(a.is_saved, 0) AS isSaved,
                COALESCE(a.is_favorite, 0) AS isFavorite,
                a.updated_at AS updatedAt
             FROM user_item_actions a
             WHERE a.user_id = :userId
               AND a.is_saved = 1
               ${clause}
             ORDER BY a.updated_at DESC`,
            {
                replacements: { userId, ...replacements },
                type: QueryTypes.SELECT
            }
        );
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Profile getSavedItems Error:', error);
        return res.status(500).json({ message: 'Không thể tải danh sách đã lưu.' });
    }
};

exports.getFavoriteItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { clause, replacements } = buildItemTypeWhere(req.query?.type);
        const rows = await sequelize.query(
            `SELECT
                a.item_id AS itemId,
                a.item_type AS type,
                COALESCE(a.is_saved, 0) AS isSaved,
                COALESCE(a.is_favorite, 0) AS isFavorite,
                a.updated_at AS updatedAt
             FROM user_item_actions a
             WHERE a.user_id = :userId
               AND a.is_favorite = 1
               ${clause}
             ORDER BY a.updated_at DESC`,
            {
                replacements: { userId, ...replacements },
                type: QueryTypes.SELECT
            }
        );
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Profile getFavoriteItems Error:', error);
        return res.status(500).json({ message: 'Không thể tải danh sách yêu thích.' });
    }
};

exports.getItemStates = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemType = normalizeItemType(req.body?.type);
        const itemIds = Array.isArray(req.body?.itemIds)
            ? req.body.itemIds.map(normalizeItemId).filter(Boolean)
            : [];

        if (!itemType || itemIds.length === 0) {
            return res.status(200).json({ data: [] });
        }

        const placeholders = itemIds.map(() => '?').join(', ');
        const rows = await sequelize.query(
            `SELECT
                a.item_id AS itemId,
                a.item_type AS type,
                COALESCE(a.is_saved, 0) AS isSaved,
                COALESCE(a.is_favorite, 0) AS isFavorite,
                a.updated_at AS updatedAt
             FROM user_item_actions a
             WHERE a.user_id = ?
               AND a.item_type = ?
               AND a.item_id IN (${placeholders})`,
            {
                replacements: [userId, itemType, ...itemIds],
                type: QueryTypes.SELECT
            }
        );

        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Profile getItemStates Error:', error);
        return res.status(500).json({ message: 'Không thể tải trạng thái mục.' });
    }
};

