/**
 * BadgeChecker Service
 * 
 * Hệ thống kiểm tra và tự động cấp thẻ thành tích (Badges) cho người dùng.
 * 
 * Cách hoạt động:
 * 1. Khi user hoàn thành quiz, service sẽ CẬP NHẬT bảng user_stats (đếm tích lũy).
 * 2. So sánh user_stats với điều kiện của tất cả badges mà user chưa đạt.
 * 3. Nếu user đạt điều kiện => INSERT vào user_badges và trả về thẻ vừa mở khóa.
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// Map từ condition_type sang cột tương ứng trong bảng user_stats
const CONDITION_TO_STAT_COLUMN = {
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

/**
 * Đảm bảo user có bản ghi trong bảng user_stats.
 * Nếu chưa có thì tạo mới với các giá trị mặc định = 0.
 */
async function ensureUserStats(userId) {
    const [existing] = await sequelize.query(
        'SELECT user_id FROM user_stats WHERE user_id = ?',
        { replacements: [userId], type: QueryTypes.SELECT }
    );
    if (!existing) {
        await sequelize.query(
            'INSERT INTO user_stats (user_id) VALUES (?)',
            { replacements: [userId], type: QueryTypes.INSERT }
        );
    }
}

/**
 * Cập nhật user_stats sau khi hoàn thành quiz.
 * @param {number} userId - ID người dùng
 * @param {object} quizResult - Kết quả quiz { correctCount, wrongCount, totalQuestions, timeTaken }
 */
async function updateStatsAfterQuiz(userId, quizResult) {
    await ensureUserStats(userId);

    const { correctCount, totalQuestions, timeTaken } = quizResult;
    const isPerfect = correctCount === totalQuestions && totalQuestions > 0;
    const isSpeedrun = timeTaken > 0 && timeTaken <= 60; // Dưới 60 giây

    // Cập nhật tổng số quiz đã làm
    let updateQuery = `
        UPDATE user_stats 
        SET total_quizzes_taken = total_quizzes_taken + 1,
            updated_at = NOW()
    `;

    // Nếu điểm tuyệt đối
    if (isPerfect) {
        updateQuery += `, total_perfect_scores = total_perfect_scores + 1`;
    }

    // Nếu speedrun
    if (isSpeedrun) {
        updateQuery += `, total_speedruns = COALESCE(total_speedruns, 0) + 1`;
    }

    // Cập nhật streak
    updateQuery += `,
        current_streak_days = CASE 
            WHEN last_practice_date = CURDATE() THEN current_streak_days
            WHEN last_practice_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN current_streak_days + 1
            ELSE 1
        END,
        max_streak_days = CASE
            WHEN last_practice_date = CURDATE() THEN max_streak_days
            WHEN last_practice_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN GREATEST(max_streak_days, current_streak_days + 1)
            ELSE GREATEST(max_streak_days, 1)
        END,
        last_practice_date = CURDATE()
    `;

    updateQuery += ` WHERE user_id = ?`;

    await sequelize.query(updateQuery, {
        replacements: [userId],
        type: QueryTypes.UPDATE
    });
}

/**
 * Kiểm tra và cấp tất cả thẻ mà user đủ điều kiện nhưng chưa nhận.
 * @param {number} userId - ID người dùng
 * @returns {Array} Danh sách thẻ mới được cấp (có thể rỗng)
 */
async function checkAndAwardBadges(userId) {
    // Lấy stats hiện tại của user
    const [stats] = await sequelize.query(
        'SELECT * FROM user_stats WHERE user_id = ?',
        { replacements: [userId], type: QueryTypes.SELECT }
    );

    if (!stats) return [];

    // Lấy tất cả badges mà user CHƯA nhận
    const unlockedBadges = await sequelize.query(
        `SELECT b.* FROM badges b
         WHERE b.id NOT IN (
             SELECT badge_id FROM user_badges WHERE user_id = ?
         )`,
        { replacements: [userId], type: QueryTypes.SELECT }
    );

    const newlyAwarded = [];

    for (const badge of unlockedBadges) {
        const statColumn = CONDITION_TO_STAT_COLUMN[badge.condition_type];
        
        // Nếu condition_type không khớp (VD: LIVE_PLAYS chưa có cột) -> bỏ qua
        if (!statColumn || stats[statColumn] === undefined || stats[statColumn] === null) {
            continue;
        }

        // Kiểm tra điều kiện: giá trị stats >= giá trị cần đạt
        if (stats[statColumn] >= badge.condition_value) {
            // Cấp thẻ cho user
            await sequelize.query(
                'INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES (?, ?, NOW())',
                { replacements: [userId, badge.id], type: QueryTypes.INSERT }
            );
            newlyAwarded.push({
                id: badge.id,
                name: badge.name,
                description: badge.description,
                icon_url: badge.icon_url,
                tier: badge.tier
            });
        }
    }

    return newlyAwarded;
}

/**
 * Entry point chính: Gọi sau khi user submit quiz.
 * Cập nhật stats -> kiểm tra badges -> trả về thẻ mới.
 */
async function processQuizCompletion(userId, quizResult) {
    try {
        await updateStatsAfterQuiz(userId, quizResult);
        const newBadges = await checkAndAwardBadges(userId);
        return newBadges;
    } catch (error) {
        console.error('BadgeChecker Error:', error);
        return [];
    }
}

module.exports = {
    ensureUserStats,
    updateStatsAfterQuiz,
    checkAndAwardBadges,
    processQuizCompletion
};
