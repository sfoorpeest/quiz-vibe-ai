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

async function listMaterials({ search, type, subject, grade, tag, page, limit, userId, roleId }) {
    const { page: normalizedPage, limit: normalizedLimit, offset } = normalizePagination(page, limit);

    /**
     * LOGIC PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL):
     * 1. Public: Mọi người đều thấy (visibility = 'public').
     * 2. Private: Chỉ người tạo thấy (created_by = userId).
     * 3. Group Shared: Thấy nếu thuộc group được giao bài (group_materials).
     * 4. Personal Shared: Thấy nếu được giao bài cá nhân (user_materials).
     */
    const whereClauses = ['(visibility = "public"'];
    const replacements = [];

    if (userId) {
        // Nếu là Teacher hoặc Admin, họ được quyền xem các học liệu do chính họ tạo ra (kể cả đang để private)
        if (roleId === 2 || roleId === 3) {
            whereClauses[0] += ' OR created_by = ?';
            replacements.push(userId);
        }
        
        // Truy vấn con: Tìm các tài liệu được giao cho các Lớp (Group) mà User này là thành viên
        whereClauses[0] += ` OR id IN (
            SELECT material_id FROM group_materials WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = ?
            )
        )`;
        replacements.push(userId);

        // Truy vấn con: Tìm các tài liệu được giao đích danh cho cá nhân User này
        whereClauses[0] += ' OR id IN (SELECT material_id FROM user_materials WHERE user_id = ?)';
        replacements.push(userId);
    }
    whereClauses[0] += ')';

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
            // === Phổ thông (THPT) ===
            'Toán học': ['Toán học', 'Toán', '#Toán'],
            'Vật lý': ['Vật lý', 'Vật lí', '#Vật lý', '#Vật lí'],
            'Hóa học': ['Hóa học', '#Hóa học', '#Hóa'],
            'Sinh học': ['Sinh học', '#Sinh học', '#Sinh'],
            'Ngữ văn': ['Ngữ văn', 'Văn học', '#Văn'],
            'Lịch sử': ['Lịch sử', '#Lịch sử', '#Sử'],
            'Địa lý': ['Địa lý', 'Địa lí', '#Địa lý', '#Địa lí', '#Địa'],
            'Tiếng Anh': ['Tiếng Anh', 'English', '#Tiếng Anh', '#Anh'],
            'Tin học': ['Tin học', 'IT', '#Tin học', '#Tin'],
            'Giáo dục công dân': ['Giáo dục công dân', 'GDCD', 'Đạo đức', 'Pháp luật'],
            // === Đại học / Chuyên ngành ===
            'Công nghệ thông tin': ['Công nghệ thông tin', 'CNTT', 'IT', 'Computing', 'Hệ thống thông tin'],
            'Khoa học máy tính': ['Khoa học máy tính', 'Computer Science', 'Thuật toán', 'Cơ sở dữ liệu', 'AI', 'Machine Learning'],
            'Kỹ thuật phần mềm': ['Kỹ thuật phần mềm', 'Software Engineering', 'Phát triển phần mềm', 'Kiểm thử', 'Maintenance'],
            'An toàn thông tin': ['An toàn thông tin', 'Cyber Security', 'Bảo mật', 'Mã hóa', 'Hacking', 'Network Security'],
            'Kinh tế & Tài chính': ['Kinh tế', 'Tài chính', 'Finance', 'Kinh tế học', 'Tiền tệ', 'Thị trường'],
            'Quản trị kinh doanh': ['Quản trị kinh doanh', 'Business Administration', 'Quản trị', 'CEO', 'Lãnh đạo', 'Doanh nghiệp'],
            'Marketing & Truyền thông': ['Marketing', 'Truyền thông', 'Communication', 'PR', 'Quảng cáo', 'Branding', 'Digital Marketing'],
            'Kế toán & Kiểm toán': ['Kế toán', 'Kiểm toán', 'Accounting', 'Auditing', 'Thuế', 'Báo cáo tài chính'],
            'Logistics & Chuỗi cung ứng': ['Logistics', 'Chuỗi cung ứng', 'Supply Chain', 'Vận chuyển', 'Kho bãi', 'Xuất nhập khẩu'],
            'Ngân hàng & Bảo hiểm': ['Ngân hàng', 'Bảo hiểm', 'Banking', 'Insurance', 'Tín dụng', 'Lãi suất'],
            'Du lịch & Khách sạn': ['Du lịch', 'Khách sạn', 'Tourism', 'Hospitality', 'Lữ hành', 'Nhà hàng'],
            'Kỹ thuật & Công nghệ': ['Kỹ thuật', 'Technology', 'Công nghệ', 'Kỹ sư'],
            'Kiến trúc & Xây dựng': ['Kiến trúc', 'Xây dựng', 'Architecture', 'Construction', 'Công trình', 'Thiết kế nhà'],
            'Điện - Điện tử': ['Điện', 'Điện tử', 'Electronics', 'Mạch điện', 'Vi điều khiển'],
            'Cơ khí & Tự động hóa': ['Cơ khí', 'Tự động hóa', 'Mechanical', 'Automation', 'Robot', 'Máy móc'],
            'Y Dược & Sức khỏe': ['Y học', 'Y khoa', 'Dược', 'Sức khỏe', 'Y tế', 'Bác sĩ', 'Bệnh lý'],
            'Điều dưỡng': ['Điều dưỡng', 'Nursing', 'Chăm sóc bệnh nhân', 'Y tá'],
            'Tâm lý học': ['Tâm lý học', 'Psychology', 'Tâm lý', 'Hành vi', 'Trị liệu'],
            'Luật & Pháp lý': ['Luật', 'Pháp luật', 'Legal', 'Tố tụng', 'Quyền lợi', 'Hiến pháp'],
            'Sư phạm & Giáo dục': ['Sư phạm', 'Giáo dục', 'Education', 'Giảng dạy', 'Phương pháp dạy học'],
            'Ngôn ngữ học': ['Ngôn ngữ học', 'Linguistics', 'Ngữ pháp', 'Ngữ âm', 'Từ vựng'],
            'Công nghệ sinh học': ['Công nghệ sinh học', 'Biotechnology', 'Gen', 'Tế bào', 'Vi sinh'],
            'Khoa học môi trường': ['Môi trường', 'Environmental Science', 'Biến đổi khí hậu', 'Sinh thái'],
            'Thiết kế đồ họa': ['Thiết kế đồ họa', 'Graphic Design', 'Photoshop', 'Illustrator', 'UI/UX', 'Mỹ thuật'],
            'Nhiếp ảnh & Điện ảnh': ['Nhiếp ảnh', 'Điện ảnh', 'Photography', 'Film', 'Quay phim', 'Dựng phim'],
            // === Xã hội & Kỹ năng ===
            'Lập trình': ['Lập trình', 'Programming', 'Code', 'JavaScript', 'Python', 'Java', 'React', 'NodeJS', 'Web'],
            'Tài chính cá nhân': ['Tài chính cá nhân', 'Tiết kiệm', 'Đầu tư', 'Quản lý tiền', 'Chứng khoán'],
            'Kỹ năng mềm': ['Kỹ năng mềm', 'Giao tiếp', 'Thuyết trình', 'Làm việc nhóm', 'Critical Thinking'],
            'Khởi nghiệp': ['Khởi nghiệp', 'Startup', 'Ý tưởng kinh doanh', 'Gọi vốn'],
            'Kinh doanh online': ['Kinh doanh online', 'E-commerce', 'Bán hàng online', 'Shopee', 'TikTok Shop'],
            'Đầu tư chứng khoán': ['Chứng khoán', 'Stock', 'Đầu tư', 'Thị trường tài chính', 'Cổ phiếu']
        };

        const subjectVariations = subjectMap[subject] || [subject];
        const variationsSQL = subjectVariations.map(() => '(title LIKE ? OR description LIKE ?)').join(' OR ');
        whereClauses.push(`(${variationsSQL})`);
        
        subjectVariations.forEach(v => {
            replacements.push(`%${v}%`, `%${v}%`);
        });
    }

    // Filter by grade/level with intelligent mapping
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

    // Filter by tag (search in description's [TAGS:...] section)
    if (tag && tag.trim()) {
        whereClauses.push('(description LIKE ?)');
        replacements.push(`%${tag.trim()}%`);
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
            /* Giao bài cá nhân */
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

            UNION

            /* Giao bài theo lớp */
            SELECT DISTINCT
                m.id,
                m.title,
                ${TYPE_CASE_SQL} AS type,
                m.content_url,
                m.content,
                m.created_at,
                gm.assigned_at,
                COALESCE((
                    SELECT lh2.progress
                    FROM learning_history lh2
                    WHERE lh2.user_id = ?
                        AND lh2.material_id = m.id
                        AND lh2.action = 'VIEWED_MATERIAL'
                    ORDER BY lh2.created_at DESC, lh2.id DESC
                    LIMIT 1
                ), 0) as progress
            FROM group_materials gm
            INNER JOIN group_members gmb ON gmb.group_id = gm.group_id
            INNER JOIN materials m ON m.id = gm.material_id
            WHERE gmb.user_id = ?
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
            replacements: [userId, userId, userId],
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

/**
 * Trích xuất danh sách tag phổ biến từ description của tất cả materials.
 * Tags được lưu dưới dạng [TAGS:tag1,tag2,tag3] trong description.
 */
async function getPopularTags(limitCount = 30) {
    const rows = await sequelize.query(
        `SELECT description FROM materials WHERE description LIKE '%[TAGS:%' AND visibility = 'public'`,
        { type: QueryTypes.SELECT }
    );

    const tagFrequency = new Map();
    rows.forEach(row => {
        const match = row.description?.match(/^\[TAGS:(.*?)\]/);
        if (match) {
            match[1].split(',').forEach(tag => {
                const cleaned = tag.trim();
                if (cleaned) {
                    tagFrequency.set(cleaned, (tagFrequency.get(cleaned) || 0) + 1);
                }
            });
        }
    });

    // Sort by frequency (most popular first), return top N
    return [...tagFrequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([tag, count]) => ({ tag, count }));
}

module.exports = {
    listMaterials,
    getMaterialDetailById,
    getMyLessons,
    getMaterialLearningSnapshot,
    computeEffectiveProgress,
    getPopularTags,
    ALLOWED_TYPES
};