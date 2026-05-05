const materialService = require('../services/materialService');

const sendError = (res, statusCode, message, error) => res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errorCode: error ? String(error.message || error) : 'MATERIAL_CONTROLLER_ERROR',
});

exports.getMaterials = async (req, res) => {
    try {
        const { search = '', type = '', subject = '', grade = '', tag = '', page = '1', limit = '10' } = req.query;
        const normalizedType = String(type || '').toLowerCase().trim();

        if (normalizedType && !materialService.ALLOWED_TYPES.has(normalizedType)) {
            return res.status(400).json({ success: false, message: 'Invalid type. Allowed values: video, audio, document', data: null, errorCode: 'INVALID_TYPE' });
        }

        const result = await materialService.listMaterials({
            search,
            type: normalizedType,
            subject,
            grade,
            tag,
            page,
            limit,
            userId: req.user?.id,
            roleId: req.user?.role_id
        });

        return res.status(200).json({ success: true, message: 'Get materials successfully', data: result, errorCode: null });
    } catch (error) {
        console.error('Get materials error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get materials', data: null, errorCode: 'GET_MATERIALS_FAILED' });
    }
};

exports.getTags = async (req, res) => {
    try {
        const tags = await materialService.getPopularTags(30);
        return res.status(200).json({ success: true, message: 'Get tags successfully', data: tags, errorCode: null });
    } catch (error) {
        console.error('Get tags error:', error);
        return sendError(res, 500, 'Failed to get tags', error);
    }
};

exports.getMaterialDetail = async (req, res) => {
    try {
        const materialId = Number.parseInt(req.params.id, 10);

        if (Number.isNaN(materialId) || materialId < 1) {
            return res.status(400).json({ success: false, message: 'Invalid material id', data: null, errorCode: 'INVALID_MATERIAL_ID' });
        }

        const material = await materialService.getMaterialDetailById(materialId);

        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found', data: null, errorCode: 'MATERIAL_NOT_FOUND' });
        }

        return res.status(200).json({
            success: true,
            message: 'Get material detail successfully',
            data: {
                id: material.id,
                title: material.title,
                type: material.type,
                content: material.content,
                url: material.content_url,
                createdAt: material.created_at
            },
            errorCode: null
        });
    } catch (error) {
        console.error('Get material detail error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get material detail', data: null, errorCode: 'GET_MATERIAL_DETAIL_FAILED' });
    }
};

exports.getMyLessons = async (req, res) => {
    try {
        const userId = req.user.id;
        const lessons = await materialService.getMyLessons(userId);

        // Synchronize with Home page logic: count all materials the user has interacted with (progress > 0)
        const totalLearned = lessons.filter(l => l.progress > 0).length;

        return res.status(200).json({ 
            success: true,
            message: 'Get my lessons successfully',
            data: {
                data: lessons,
                stats: {
                    totalLessons: totalLearned,
                    totalHours: 45 // Progressing tracking for hours still pending DB update
                }
            },
            errorCode: null
        });
    } catch (error) {
        console.error('Get my lessons error:', error);
        return sendError(res, 500, 'Failed to get my lessons', error);
    }
};

exports.getSavedMaterials = async (req, res) => {
    try {
        const userId = req.user.id;
        const materials = await materialService.getSavedMaterials(userId);
        return res.status(200).json({ success: true, message: 'Get saved materials successfully', data: materials, errorCode: null });
    } catch (error) {
        console.error('Get saved materials error:', error);
        return sendError(res, 500, 'Failed to get saved materials', error);
    }
};

exports.getFavoriteMaterials = async (req, res) => {
    try {
        const userId = req.user.id;
        const materials = await materialService.getFavoriteMaterials(userId);
        return res.status(200).json({ success: true, message: 'Get favorite materials successfully', data: materials, errorCode: null });
    } catch (error) {
        console.error('Get favorite materials error:', error);
        return sendError(res, 500, 'Failed to get favorite materials', error);
    }
};

exports.saveMaterial = async (req, res) => {
    try {
        const userId = req.user.id;
        const materialId = Number(req.params.materialId);
        const preference = await materialService.setMaterialPreference(userId, materialId, { isSaved: true });
        return res.status(200).json({ success: true, message: 'Save material successfully', data: preference, errorCode: null });
    } catch (error) {
        if (error.message === 'INVALID_MATERIAL_ID') {
            return res.status(400).json({ success: false, message: 'Invalid material id', data: null, errorCode: 'INVALID_MATERIAL_ID' });
        }
        if (error.message === 'MATERIAL_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Material not found', data: null, errorCode: 'MATERIAL_NOT_FOUND' });
        }
        console.error('Save material error:', error);
        return sendError(res, 500, 'Failed to save material', error);
    }
};

exports.unsaveMaterial = async (req, res) => {
    try {
        const userId = req.user.id;
        const materialId = Number(req.params.materialId);
        const preference = await materialService.setMaterialPreference(userId, materialId, { isSaved: false });
        return res.status(200).json({ success: true, message: 'Unsave material successfully', data: preference, errorCode: null });
    } catch (error) {
        if (error.message === 'INVALID_MATERIAL_ID') {
            return res.status(400).json({ success: false, message: 'Invalid material id', data: null, errorCode: 'INVALID_MATERIAL_ID' });
        }
        if (error.message === 'MATERIAL_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Material not found', data: null, errorCode: 'MATERIAL_NOT_FOUND' });
        }
        console.error('Unsave material error:', error);
        return sendError(res, 500, 'Failed to unsave material', error);
    }
};

exports.favoriteMaterial = async (req, res) => {
    try {
        const userId = req.user.id;
        const materialId = Number(req.params.materialId);
        const preference = await materialService.setMaterialPreference(userId, materialId, { isFavorite: true });
        return res.status(200).json({ success: true, message: 'Favorite material successfully', data: preference, errorCode: null });
    } catch (error) {
        if (error.message === 'INVALID_MATERIAL_ID') {
            return res.status(400).json({ success: false, message: 'Invalid material id', data: null, errorCode: 'INVALID_MATERIAL_ID' });
        }
        if (error.message === 'MATERIAL_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Material not found', data: null, errorCode: 'MATERIAL_NOT_FOUND' });
        }
        console.error('Favorite material error:', error);
        return sendError(res, 500, 'Failed to favorite material', error);
    }
};

exports.unfavoriteMaterial = async (req, res) => {
    try {
        const userId = req.user.id;
        const materialId = Number(req.params.materialId);
        const preference = await materialService.setMaterialPreference(userId, materialId, { isFavorite: false });
        return res.status(200).json({ success: true, message: 'Unfavorite material successfully', data: preference, errorCode: null });
    } catch (error) {
        if (error.message === 'INVALID_MATERIAL_ID') {
            return res.status(400).json({ success: false, message: 'Invalid material id', data: null, errorCode: 'INVALID_MATERIAL_ID' });
        }
        if (error.message === 'MATERIAL_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Material not found', data: null, errorCode: 'MATERIAL_NOT_FOUND' });
        }
        console.error('Unfavorite material error:', error);
        return sendError(res, 500, 'Failed to unfavorite material', error);
    }
};