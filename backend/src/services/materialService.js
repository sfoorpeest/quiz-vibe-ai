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
    const readAt = toTimeValue(readingUpdatedAt);
    const quizAt = toTimeValue(quizAttemptedAt);

    if (quizStatus === 'FAIL' && (!readAt || quizAt >= readAt)) {
        return 0;
    }

    if (quizStatus === 'PASS') {
        return Math.min(100, normalizedReading + 10);
    }

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
        // Extract number if it's like "Lớp 10", "Lớp 11"
        const gradeNumber = grade.match(/\d+/);
        const gradeSearch = gradeNumber ? gradeNumber[0] : grade;
        
        whereClauses.push('(title LIKE ? OR description LIKE ?)');
        replacements.push(`%${gradeSearch}%`, `%${gradeSearch}%`);
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
                                COALESCE((
                                        SELECT lh2.progress
                                        FROM learning_history lh2
                                        WHERE lh2.user_id = um.user_id
                                            AND lh2.material_id = m.id
                                            AND lh2.action = 'VIEWED_MATERIAL'
                                        ORDER BY lh2.created_at DESC, lh2.id DESC
                                        LIMIT 1
                                ), 0) as progress
            FROM user_materials um
            INNER JOIN materials m ON m.id = um.material_id
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
            COALESCE(lh.progress, 0) as progress
        FROM learning_history lh
        INNER JOIN materials m ON m.id = lh.material_id
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
    try {
        assignedRows = await sequelize.query(assignmentQuery, {
            replacements: [userId],
            type: QueryTypes.SELECT
        });
    } catch (error) {
        console.error('MY LESSONS ERROR:', error);
        // If user_materials does not exist yet, continue with fallback query.
        const isMissingRelation =
            String(error?.original?.code || '') === 'ER_NO_SUCH_TABLE' ||
            /user_materials/i.test(String(error?.message || ''));

        if (!isMissingRelation) {
            throw error;
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

        const existingRead = normalizeReadProgress(existing.progress);
        const candidateRead = normalizeReadProgress(row.progress);
        const existingTime = toTimeValue(existing.activity_at || existing.assigned_at || existing.created_at);
        const candidateTime = toTimeValue(row.activity_at || row.assigned_at || row.created_at);

        if (candidateRead > existingRead || (candidateRead === existingRead && candidateTime > existingTime)) {
            mergedById.set(id, { ...existing, ...row });
        }
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
            last_score: latestQuiz ? Number(latestQuiz.last_score) : null,
            quiz_status: quizStatus,
            last_attempt_date: latestQuiz?.last_attempt_date || null,
        };
    });
}

module.exports = {
    listMaterials,
    getMaterialDetailById,
    getMyLessons,
    getMaterialLearningSnapshot,
    computeEffectiveProgress,
    ALLOWED_TYPES
};