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

async function listMaterials({ search, type, page, limit }) {
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
            q.created_at
        FROM (
            SELECT DISTINCT
                m.id,
                m.title,
                ${TYPE_CASE_SQL} AS type,
                m.content_url,
                m.content,
                m.created_at,
                um.assigned_at
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
            m.created_at
        FROM learning_history lh
        INNER JOIN materials m ON m.id = lh.material_id
        WHERE lh.user_id = ?
          AND lh.material_id IS NOT NULL
        ORDER BY m.created_at DESC
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