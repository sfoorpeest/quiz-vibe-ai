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
                COALESCE((SELECT MAX(progress) FROM learning_history WHERE user_id = um.user_id AND material_id = m.id), 0) as progress
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
          AND lh.id = (SELECT MAX(id) FROM learning_history WHERE user_id = lh.user_id AND material_id = m.id)
        ORDER BY activity_at DESC
    `;

    // Preferred source for My Lessons is explicit assignment relation.
    // Fallback keeps API usable before migration/data backfill is completed.
    try {
        const assignedRows = await sequelize.query(assignmentQuery, {
            replacements: [userId],
            type: QueryTypes.SELECT
        });

        if (assignedRows.length > 0) {
            return assignedRows;
        }
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

    return sequelize.query(fallbackQuery, {
        replacements: [userId],
        type: QueryTypes.SELECT
    });
}

module.exports = {
    listMaterials,
    getMaterialDetailById,
    getMyLessons,
    ALLOWED_TYPES
};