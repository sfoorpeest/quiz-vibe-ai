const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const TYPE_CASE_SQL = `
    CASE
        WHEN LOWER(COALESCE(content_url, '')) LIKE '%.mp4'
            OR LOWER(COALESCE(content_url, '')) LIKE '%.mov'
            OR LOWER(COALESCE(content_url, '')) LIKE '%.avi'
            OR LOWER(COALESCE(content_url, '')) LIKE '%.mkv'
        THEN 'video'

        WHEN LOWER(COALESCE(content_url, '')) LIKE '%.mp3'
            OR LOWER(COALESCE(content_url, '')) LIKE '%.wav'
            OR LOWER(COALESCE(content_url, '')) LIKE '%.ogg'
        THEN 'audio'

        ELSE 'document'
    END
`;

const ALLOWED_TYPES = new Set(['video', 'audio', 'document']);

async function tableExists(tableName) {
    const [row] = await sequelize.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        {
            replacements: [tableName],
            type: QueryTypes.SELECT
        }
    );

    return Number(row?.total || 0) > 0;
}

function normalizeReadProgress(progress) {
    const parsed = Number(progress);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.max(0, Math.min(90, Math.round(parsed)));
}

function toTimeValue(value) {
    if (!value) {
        return 0;
    }

    const timeValue = new Date(value).getTime();
    return Number.isFinite(timeValue) ? timeValue : 0;
}

function computeEffectiveProgress({ readingProgress, readingUpdatedAt, quizStatus, quizAttemptedAt }) {
    const normalizedReading = normalizeReadProgress(readingProgress);
    
    // Nếu đã pass quiz, tặng thêm 10% bonus (max 100%)
    if (quizStatus === 'PASS') {
        return Math.min(100, normalizedReading + 10);
    }

    // Ngay cả khi FAIL, chúng ta vẫn giữ lại tiến độ đọc của người dùng để tránh gây hiểu lầm "mất dữ liệu"
    return normalizedReading;
}

async function getMaterialLearningSnapshot(userId, materialId) {
    const normalizedMaterialId = Number(materialId);
    if (!Number.isInteger(normalizedMaterialId) || normalizedMaterialId <= 0) {
        return {
            readingProgress: 0,
            progress: 0,
            quizStatus: null,
            lastScore: null,
            readingUpdatedAt: null,
            quizAttemptedAt: null,
        };
    }

    const [latestView] = await sequelize.query(
        `SELECT progress, created_at
         FROM learning_history
         WHERE user_id = ?
           AND material_id = ?
           AND action = 'VIEWED_MATERIAL'
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        {
            replacements: [userId, normalizedMaterialId],
            type: QueryTypes.SELECT
        }
    );

    const [latestQuiz] = await sequelize.query(
        `SELECT
            COALESCE(correct_count, ROUND(score), 0) AS last_score,
            CASE WHEN COALESCE(correct_count, ROUND(score), 0) >= 3 THEN 'PASS' ELSE 'FAIL' END AS quiz_status,
            COALESCE(created_at, submitted_at) AS last_attempt_date
         FROM results
         WHERE user_id = ?
           AND material_id = ?
         ORDER BY COALESCE(created_at, submitted_at) DESC, id DESC
         LIMIT 1`,
        {
            replacements: [userId, normalizedMaterialId],
            type: QueryTypes.SELECT
        }
    );

    const readingProgress = normalizeReadProgress(latestView?.progress);
    const quizStatus = latestQuiz?.quiz_status || null;

    return {
        readingProgress,
        progress: computeEffectiveProgress({
            readingProgress,
            readingUpdatedAt: latestView?.created_at || null,
            quizStatus,
            quizAttemptedAt: latestQuiz?.last_attempt_date || null,
        }),
        quizStatus,
        lastScore: latestQuiz ? Number(latestQuiz.last_score) : null,
        readingUpdatedAt: latestView?.created_at || null,
        quizAttemptedAt: latestQuiz?.last_attempt_date || null,
    };
}

function normalizePagination(page, limit) {
    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);

    const normalizedPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const normalizedLimit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100);

    return { page: normalizedPage, limit: normalizedLimit, offset: (normalizedPage - 1) * normalizedLimit };
}

async function listMaterials({ search, type, subject, grade, page, limit }) {
    const { page: normalizedPage, limit: normalizedLimit, offset } = normalizePagination(page, limit);

    const whereClauses = ['1=1'];
    const replacements = [];

    if (search && search.trim()) {
        whereClauses.push('(title LIKE ? OR description LIKE ?)');
        replacements.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (type && ALLOWED_TYPES.has(type)) {
        whereClauses.push(`${TYPE_CASE_SQL} = ?`);
        replacements.push(type);
    }

    // Filter by subject with intelligent mapping (Refined to prevent false positives)
    if (subject && subject !== 'Tất cả') {
        const subjectMap = {
            'Toán học': ['Toán học', 'Toán', '#Toán'],
            'Vật lý': ['Vật lý', 'Vật lí', '#Vật lý', '#Vật lí'],
            'Hóa học': ['Hóa học', '#Hóa học', '#Hóa'],
            'Sinh học': ['Sinh học', '#Sinh học', '#Sinh'],
            'Ngữ văn': ['Ngữ văn', 'Văn học', '#Văn'],
            'Lịch sử': ['Lịch sử', '#Lịch sử', '#Sử'],
            'Địa lý': ['Địa lý', 'Địa lí', '#Địa lý', '#Địa lí', '#Địa'],
            'Tiếng Anh': ['Tiếng Anh', 'English', '#Tiếng Anh', '#Anh'],
            'Tin học': ['Tin học', 'IT', '#Tin học', '#Tin']
        };

        const subjectVariations = subjectMap[subject] || [subject];
        const variationsSQL = subjectVariations.map(() => '(title LIKE ? OR description LIKE ?)').join(' OR ');
        whereClauses.push(`(${variationsSQL})`);
        
        subjectVariations.forEach(v => {
            replacements.push(`%${v}%`, `%${v}%`);
        });
    }

    // Filter by grade (e.g., "Lớp 12")
    if (grade && grade !== 'Tất cả') {
        const gradeMap = {
            'Lớp 10': ['Lớp 10', 'lớp 10', 'khối 10', 'K10', ' 10', '#10'],
            'Lớp 11': ['Lớp 11', 'lớp 11', 'khối 11', 'K11', ' 11', '#11'],
            'Lớp 12': ['Lớp 12', 'lớp 12', 'khối 12', 'K12', ' 12', '#12', 'thi THPT'],
            'Đại học': ['Đại học', 'Sinh viên', 'Đại cương', 'Chuyên ngành', 'Năm 1', 'Năm 2', 'Năm 3', 'Năm 4'],
            'Sau đại học': ['Sau đại học', 'Thạc sĩ', 'Tiến sĩ', 'Cao học', 'Nghiên cứu'],
            'Tự học/Khác': ['Tự học', 'Kỹ năng', 'Chứng chỉ', 'Ngoài lề', 'Xã hội']
        };

        const gradeVariations = gradeMap[grade];
        if (gradeVariations) {
            const gradeSQL = gradeVariations.map(() => '(title LIKE ? OR description LIKE ?)').join(' OR ');
            whereClauses.push(`(${gradeSQL})`);
            gradeVariations.forEach(v => {
                replacements.push(`%${v}%`, `%${v}%`);
            });
        } else {
            // Fallback: tìm trực tiếp
            whereClauses.push('(title LIKE ? OR description LIKE ?)');
            replacements.push(`%${grade}%`, `%${grade}%`);
        }
    }

    const whereSQL = whereClauses.join(' AND ');

    const dataQuery = `
        SELECT
            id,
            title,
            description,
            content_url,
            content,
            created_by,
            created_at,
            updated_at,
            ${TYPE_CASE_SQL} AS type
        FROM materials
        WHERE ${whereSQL}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;

    const totalQuery = `
        SELECT COUNT(*) AS total
        FROM materials
        WHERE ${whereSQL}
    `;

    const rows = await sequelize.query(dataQuery, {
        replacements: [...replacements, normalizedLimit, offset],
        type: QueryTypes.SELECT
    });

    const totalRows = await sequelize.query(totalQuery, {
        replacements,
        type: QueryTypes.SELECT
    });

    return {
        data: rows,
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total: totalRows[0] ? Number(totalRows[0].total) : 0
        }
    };
}

async function getMaterialDetailById(id) {
    const detailQuery = `
        SELECT
            id,
            title,
            content,
            content_url,
            tags,
            created_at,
            ${TYPE_CASE_SQL} AS type
        FROM materials
        WHERE id = ?
        LIMIT 1
    `;

    const rows = await sequelize.query(detailQuery, {
        replacements: [id],
        type: QueryTypes.SELECT
    });

    return rows[0] || null;
}

async function getMyLessons(userId) {
    const hasUserMaterials = await tableExists('user_materials');
    const hasPreferences = await tableExists('user_material_preferences');

    const assignmentQuery = `
        SELECT
            q.id,
            q.title,
            q.type,
            q.content_url,
            q.content,
            q.created_at,
            q.progress
        FROM (
            SELECT DISTINCT
                m.id,
                m.title,
                ${TYPE_CASE_SQL} AS type,
                m.content_url,
                m.content,
                m.created_at,
                um.assigned_at,
                ${hasPreferences ? 'COALESCE(pref.is_saved, 0)' : '0'} AS is_saved,
                ${hasPreferences ? 'COALESCE(pref.is_favorite, 0)' : '0'} AS is_favorite,
                COALESCE((
                    SELECT lh2.progress
                    FROM learning_history lh2
                    WHERE lh2.user_id = um.user_id
                        AND lh2.material_id = m.id
                        AND lh2.action = 'VIEWED_MATERIAL'
                    ORDER BY lh2.created_at DESC, lh2.id DESC
                    LIMIT 1
                ), 0) AS progress
            FROM user_materials um
            INNER JOIN materials m ON m.id = um.material_id
            ${hasPreferences ? `LEFT JOIN user_material_preferences pref
                ON pref.user_id = um.user_id
               AND pref.material_id = m.id` : ''}
            WHERE um.user_id = ?
        ) q
        ORDER BY COALESCE(q.assigned_at, q.created_at) DESC
    `;

    const fallbackQuery = `
        SELECT DISTINCT
            m.id,
            m.title,
            ${TYPE_CASE_SQL} AS type,
            m.content_url,
            m.content,
            m.created_at,
            lh.created_at as activity_at,
            ${hasPreferences ? 'COALESCE(pref.is_saved, 0)' : '0'} AS is_saved,
            ${hasPreferences ? 'COALESCE(pref.is_favorite, 0)' : '0'} AS is_favorite,
            COALESCE(lh.progress, 0) AS progress
        FROM learning_history lh
        INNER JOIN materials m ON m.id = lh.material_id
        ${hasPreferences ? `LEFT JOIN user_material_preferences pref
            ON pref.user_id = lh.user_id
           AND pref.material_id = m.id` : ''}
        WHERE lh.user_id = ?
          AND lh.material_id IS NOT NULL
          AND lh.action = 'VIEWED_MATERIAL'
          AND lh.id = (
                SELECT MAX(id)
                FROM learning_history
                WHERE user_id = lh.user_id
                    AND material_id = m.id
                    AND action = 'VIEWED_MATERIAL'
          )
        ORDER BY activity_at DESC
    `;

    // Preferred source remains assignments, but read-history rows must be merged in so
    // progress does not drop when a material is learned outside assignment mapping.
    let assignedRows = [];
    if (hasUserMaterials) {
        try {
        assignedRows = await sequelize.query(assignmentQuery, {
            replacements: [userId],
            type: QueryTypes.SELECT
        });
        } catch (error) {
            console.error('MY LESSONS ERROR:', error);
            const isMissingRelation =
                String(error?.original?.code || '') === 'ER_NO_SUCH_TABLE' ||
                /user_materials|user_material_preferences/i.test(String(error?.message || ''));

            if (!isMissingRelation) {
                throw error;
            }
        }
    }

    const fallbackRows = await sequelize.query(fallbackQuery, {
        replacements: [userId],
        type: QueryTypes.SELECT
    });

    const mergedById = new Map();
    [...assignedRows, ...fallbackRows].forEach((row) => {
        const id = Number(row?.id);
        if (!Number.isInteger(id) || id <= 0) {
            return;
        }

        const existing = mergedById.get(id);
        if (!existing) {
            mergedById.set(id, row);
            return;
        }

        const mergedFlags = {
            is_saved: Number(existing.is_saved || 0) || Number(row.is_saved || 0) ? 1 : 0,
            is_favorite: Number(existing.is_favorite || 0) || Number(row.is_favorite || 0) ? 1 : 0,
        };

        const existingRead = normalizeReadProgress(existing.progress);
        const candidateRead = normalizeReadProgress(row.progress);
        const existingTime = toTimeValue(existing.activity_at || existing.assigned_at || existing.created_at);
        const candidateTime = toTimeValue(row.activity_at || row.assigned_at || row.created_at);

        if (candidateRead > existingRead || (candidateRead === existingRead && candidateTime > existingTime)) {
            mergedById.set(id, { ...existing, ...row, ...mergedFlags });
            return;
        }

        mergedById.set(id, { ...existing, ...mergedFlags });
    });

    return attachLatestQuizResult([...mergedById.values()], userId);
}

async function attachLatestQuizResult(lessons, userId) {
    if (!Array.isArray(lessons) || lessons.length === 0) {
        return lessons;
    }

    const materialIds = [...new Set(lessons.map((lesson) => Number(lesson.id)).filter((id) => Number.isInteger(id) && id > 0))];
    if (materialIds.length === 0) {
        return lessons;
    }

    const placeholders = materialIds.map(() => '?').join(', ');
    const latestQuizQuery = `
        SELECT
            r.material_id,
            COALESCE(r.correct_count, ROUND(r.score), 0) AS last_score,
            CASE WHEN COALESCE(r.correct_count, ROUND(r.score), 0) >= 3 THEN 'PASS' ELSE 'FAIL' END AS quiz_status,
            COALESCE(r.created_at, r.submitted_at) AS last_attempt_date
        FROM results r
        INNER JOIN (
            SELECT
                material_id,
                MAX(COALESCE(created_at, submitted_at)) AS max_attempt_date
            FROM results
            WHERE user_id = ?
              AND material_id IS NOT NULL
            GROUP BY material_id
        ) latest
            ON latest.material_id = r.material_id
           AND COALESCE(r.created_at, r.submitted_at) = latest.max_attempt_date
        WHERE r.user_id = ?
          AND r.material_id IN (${placeholders})
    `;

    const latestRows = await sequelize.query(latestQuizQuery, {
        replacements: [userId, userId, ...materialIds],
        type: QueryTypes.SELECT
    });

    const quizByMaterialId = new Map(
        latestRows.map((row) => [Number(row.material_id), row])
    );

    return lessons.map((lesson) => {
        const latestQuiz = quizByMaterialId.get(Number(lesson.id));
        const baseProgress = normalizeReadProgress(lesson.progress);
        const quizStatus = latestQuiz?.quiz_status || null;
        const effectiveProgress = computeEffectiveProgress({
            readingProgress: baseProgress,
            readingUpdatedAt: lesson.activity_at || lesson.assigned_at || lesson.created_at || null,
            quizStatus,
            quizAttemptedAt: latestQuiz?.last_attempt_date || null,
        });

        return {
            ...lesson,
            progress: effectiveProgress,
            reading_progress: baseProgress,
            is_saved: Number(lesson.is_saved || 0),
            is_favorite: Number(lesson.is_favorite || 0),
            last_score: latestQuiz ? Number(latestQuiz.last_score) : null,
            quiz_status: quizStatus,
            last_attempt_date: latestQuiz?.last_attempt_date || null,
        };
    });
}

async function getPopularTags(limitCount = 30) {
    const hasTagsColumn = await sequelize.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'materials'
           AND COLUMN_NAME = 'tags'`,
        { type: QueryTypes.SELECT }
    );

    if (Number(hasTagsColumn?.[0]?.total || 0) === 0) {
        return [];
    }

    const rows = await sequelize.query(
        `SELECT tags FROM materials WHERE tags IS NOT NULL AND TRIM(tags) <> ''`,
        { type: QueryTypes.SELECT }
    );

    const tagFrequency = new Map();
    rows.forEach((row) => {
        String(row?.tags || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .forEach((tag) => {
                tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
            });
    });

    return [...tagFrequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([tag, count]) => ({ tag, count }));
}

async function getPreferredMaterials(userId, preferenceField) {
    const hasPreferences = await tableExists('user_material_preferences');
    if (!hasPreferences) {
        return [];
    }

    const field = preferenceField === 'is_favorite' ? 'is_favorite' : 'is_saved';
    const rows = await sequelize.query(
        `SELECT
            m.id,
            m.title,
            ${TYPE_CASE_SQL} AS type,
            m.content_url,
            m.content,
            m.created_at,
            pref.updated_at AS preference_updated_at,
            COALESCE(pref.is_saved, 0) AS is_saved,
            COALESCE(pref.is_favorite, 0) AS is_favorite,
            COALESCE((
                SELECT lh2.progress
                FROM learning_history lh2
                WHERE lh2.user_id = pref.user_id
                  AND lh2.material_id = m.id
                  AND lh2.action = 'VIEWED_MATERIAL'
                ORDER BY lh2.created_at DESC, lh2.id DESC
                LIMIT 1
            ), 0) AS progress
         FROM user_material_preferences pref
         INNER JOIN materials m ON m.id = pref.material_id
         WHERE pref.user_id = ?
           AND pref.${field} = 1
         ORDER BY pref.updated_at DESC`,
        {
            replacements: [userId],
            type: QueryTypes.SELECT
        }
    );

    return attachLatestQuizResult(rows, userId);
}

async function getSavedMaterials(userId) {
    return getPreferredMaterials(userId, 'is_saved');
}

async function getFavoriteMaterials(userId) {
    return getPreferredMaterials(userId, 'is_favorite');
}

async function materialExists(materialId) {
    const [row] = await sequelize.query(
        `SELECT id FROM materials WHERE id = ? LIMIT 1`,
        {
            replacements: [materialId],
            type: QueryTypes.SELECT
        }
    );

    return Boolean(row?.id);
}

async function setMaterialPreference(userId, materialId, updates) {
    const hasPreferences = await tableExists('user_material_preferences');
    if (!hasPreferences) {
        return {
            materialId: Number(materialId),
            isSaved: Boolean(updates.isSaved),
            isFavorite: Boolean(updates.isFavorite),
        };
    }

    const normalizedMaterialId = Number(materialId);
    if (!Number.isInteger(normalizedMaterialId) || normalizedMaterialId <= 0) {
        throw new Error('INVALID_MATERIAL_ID');
    }

    const exists = await materialExists(normalizedMaterialId);
    if (!exists) {
        throw new Error('MATERIAL_NOT_FOUND');
    }

    const [existing] = await sequelize.query(
        `SELECT is_saved, is_favorite
         FROM user_material_preferences
         WHERE user_id = ? AND material_id = ?
         LIMIT 1`,
        {
            replacements: [userId, normalizedMaterialId],
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
        `INSERT INTO user_material_preferences
            (user_id, material_id, is_saved, is_favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            is_saved = VALUES(is_saved),
            is_favorite = VALUES(is_favorite),
            updated_at = NOW()`,
        {
            replacements: [
                userId,
                normalizedMaterialId,
                nextSaved ? 1 : 0,
                nextFavorite ? 1 : 0,
            ],
            type: QueryTypes.INSERT
        }
    );

    const [snapshot] = await sequelize.query(
        `SELECT
            material_id,
            COALESCE(is_saved, 0) AS is_saved,
            COALESCE(is_favorite, 0) AS is_favorite
         FROM user_material_preferences
         WHERE user_id = ? AND material_id = ?
         LIMIT 1`,
        {
            replacements: [userId, normalizedMaterialId],
            type: QueryTypes.SELECT
        }
    );

    return {
        materialId: normalizedMaterialId,
        isSaved: Boolean(snapshot?.is_saved),
        isFavorite: Boolean(snapshot?.is_favorite),
    };
}

module.exports = {
    listMaterials,
    getMaterialDetailById,
    getMyLessons,
    getSavedMaterials,
    getFavoriteMaterials,
    setMaterialPreference,
    getMaterialLearningSnapshot,
    computeEffectiveProgress,
    getPopularTags,
    ALLOWED_TYPES
};