/**
 * Badge Controller
 * API endpoints cho hệ thống Thẻ Thành Tích (e-Learning Badges)
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * GET /api/badges
 * Lấy danh sách toàn bộ thẻ + trạng thái đã nhận/chưa nhận của user hiện tại.
 * Trả về tiến trình (progress) dựa trên user_stats.
 */
exports.getAllBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy toàn bộ badges
        const badges = await sequelize.query(
            'SELECT * FROM badges ORDER BY FIELD(tier, "BRONZE", "SILVER", "GOLD", "DIAMOND"), condition_value ASC',
            { type: QueryTypes.SELECT }
        );

        // Lấy badges mà user đã nhận
        const userBadges = await sequelize.query(
            'SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ?',
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        // Lấy user stats để tính tiến trình
        const [stats] = await sequelize.query(
            'SELECT * FROM user_stats WHERE user_id = ?',
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        // Map condition_type sang column name trong user_stats
        const conditionMap = {
            'QUIZ_COUNT': 'total_quizzes_taken',
            'PERFECT_SCORE': 'total_perfect_scores',
            'STREAK_DAYS': 'current_streak_days',
            'LIVE_WINS': 'total_live_wins',
            'LIVE_PLAYS': 'total_live_plays',
            'SOLO_PLAYS': 'total_solo_plays',
            'MONSTER_KILLS': 'total_monster_kills',
            'LIVE_WIN_STREAK': 'current_live_win_streak',
            'SPEEDRUN': 'total_speedruns'
        };

        // Tạo Set để kiểm tra nhanh
        const unlockedMap = {};
        userBadges.forEach(ub => {
            unlockedMap[ub.badge_id] = ub.unlocked_at;
        });

        // Gắn trạng thái vào từng badge
        const enrichedBadges = badges.map(badge => {
            const isUnlocked = !!unlockedMap[badge.id];
            const statColumn = conditionMap[badge.condition_type];
            const currentValue = stats && statColumn ? (stats[statColumn] || 0) : 0;
            const progress = Math.min(Math.round((currentValue / badge.condition_value) * 100), 100);

            return {
                ...badge,
                unlocked: isUnlocked,
                unlocked_at: unlockedMap[badge.id] || null,
                progress,
                current_value: currentValue
            };
        });

        // Phân nhóm theo tier
        const grouped = {
            DIAMOND: enrichedBadges.filter(b => b.tier === 'DIAMOND'),
            GOLD: enrichedBadges.filter(b => b.tier === 'GOLD'),
            SILVER: enrichedBadges.filter(b => b.tier === 'SILVER'),
            BRONZE: enrichedBadges.filter(b => b.tier === 'BRONZE')
        };

        const totalUnlocked = userBadges.length;
        const totalBadges = badges.length;

        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    total: totalBadges,
                    unlocked: totalUnlocked,
                    percentage: totalBadges > 0 ? Math.round((totalUnlocked / totalBadges) * 100) : 0
                },
                grouped,
                all: enrichedBadges
            }
        });
    } catch (error) {
        console.error('Get All Badges Error:', error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách thẻ thành tích' });
    }
};

/**
 * GET /api/badges/user-stats
 * Lấy thống kê tích lũy của user hiện tại.
 */
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [stats] = await sequelize.query(
            'SELECT * FROM user_stats WHERE user_id = ?',
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        if (!stats) {
            return res.status(200).json({
                status: 'success',
                data: {
                    total_quizzes_taken: 0,
                    total_perfect_scores: 0,
                    current_streak_days: 0,
                    max_streak_days: 0,
                    total_live_wins: 0,
                    total_monster_kills: 0,
                    total_speedruns: 0,
                    total_live_plays: 0,
                    total_solo_plays: 0,
                    current_live_win_streak: 0,
                    last_practice_date: null
                }
            });
        }

        res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Get User Stats Error:', error);
        res.status(500).json({ message: 'Lỗi khi tải thống kê người dùng' });
    }
};

/**
 * GET /api/badges/recent
 * Lấy thẻ mới nhận gần đây (tối đa 5 thẻ) cho notification.
 */
exports.getRecentBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        const recentBadges = await sequelize.query(
            `SELECT b.*, ub.unlocked_at 
             FROM user_badges ub 
             JOIN badges b ON b.id = ub.badge_id 
             WHERE ub.user_id = ? 
             ORDER BY ub.unlocked_at DESC 
             LIMIT 5`,
            { replacements: [userId], type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 'success',
            data: recentBadges
        });
    } catch (error) {
        console.error('Get Recent Badges Error:', error);
        res.status(500).json({ message: 'Lỗi khi tải thẻ gần đây' });
    }
};

/**
 * POST /api/badges/equip
 * Trang bị 1 thẻ đại diện cho Bảng xếp hạng.
 */
exports.equipBadge = async (req, res) => {
    try {
        const userId = req.user.id;
        const { badgeId } = req.body;

        if (!badgeId) {
            // Un-equip (tháo trang bị)
            await sequelize.query(
                'UPDATE user_profiles SET equipped_badge_id = NULL WHERE user_id = ?',
                { replacements: [userId], type: QueryTypes.UPDATE }
            );
            return res.status(200).json({ status: 'success', message: 'Đã tháo trang bị danh hiệu' });
        }

        // Kiểm tra xem user đã mở khóa thẻ này chưa
        const [userBadge] = await sequelize.query(
            'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
            { replacements: [userId, badgeId], type: QueryTypes.SELECT }
        );

        if (!userBadge) {
            return res.status(403).json({ message: 'Bạn chưa đạt được thành tựu này!' });
        }

        // Cập nhật DB
        await sequelize.query(
            'UPDATE user_profiles SET equipped_badge_id = ? WHERE user_id = ?',
            { replacements: [badgeId, userId], type: QueryTypes.UPDATE }
        );

        res.status(200).json({ status: 'success', message: 'Đã trang bị danh hiệu thành công' });
    } catch (error) {
        console.error('Equip Badge Error:', error);
        res.status(500).json({ message: 'Lỗi khi trang bị danh hiệu' });
    }
};

/**
 * POST /api/badges/feature
 * Ghim tối đa 3 thẻ lên Profile Header.
 */
exports.featureBadges = async (req, res) => {
    try {
        const userId = req.user.id;
        const { badgeIds } = req.body; // Array of badge IDs

        if (!Array.isArray(badgeIds) || badgeIds.length > 3) {
            return res.status(400).json({ message: 'Chỉ được ghim tối đa 3 thành tựu' });
        }

        if (badgeIds.length > 0) {
            // Kiểm tra xem user đã mở khóa tất cả thẻ này chưa
            const userBadges = await sequelize.query(
                'SELECT badge_id FROM user_badges WHERE user_id = ? AND badge_id IN (?)',
                { replacements: [userId, badgeIds], type: QueryTypes.SELECT }
            );

            const unlockedIds = userBadges.map(b => b.badge_id);
            const allUnlocked = badgeIds.every(id => unlockedIds.includes(id));

            if (!allUnlocked) {
                return res.status(403).json({ message: 'Bạn chỉ có thể ghim các thành tựu đã đạt được!' });
            }
        }

        // Cập nhật DB (lưu dưới dạng chuỗi JSON)
        await sequelize.query(
            'UPDATE user_profiles SET featured_badges = ? WHERE user_id = ?',
            { replacements: [JSON.stringify(badgeIds), userId], type: QueryTypes.UPDATE }
        );

        res.status(200).json({ status: 'success', message: 'Đã cập nhật thành tựu trưng bày' });
    } catch (error) {
        console.error('Feature Badges Error:', error);
        res.status(500).json({ message: 'Lỗi khi ghim thành tựu' });
    }
};
