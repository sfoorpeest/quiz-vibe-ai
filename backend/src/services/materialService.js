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

module.exports = {
    listMaterials,
    ALLOWED_TYPES
};