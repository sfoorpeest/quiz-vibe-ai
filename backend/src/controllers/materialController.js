const materialService = require('../services/materialService');

exports.getMaterials = async (req, res) => {
    try {
        const { search = '', type = '', page = '1', limit = '10' } = req.query;
        const normalizedType = String(type || '').toLowerCase().trim();

        if (normalizedType && !materialService.ALLOWED_TYPES.has(normalizedType)) {
            return res.status(400).json({ message: 'Invalid type. Allowed values: video, audio, document' });
        }

        const result = await materialService.listMaterials({
            search,
            type: normalizedType,
            page,
            limit
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Get materials error:', error);
        return res.status(500).json({ message: 'Failed to get materials' });
    }
};

exports.getMaterialDetail = async (req, res) => {
    try {
        const materialId = Number.parseInt(req.params.id, 10);

        if (Number.isNaN(materialId) || materialId < 1) {
            return res.status(400).json({ message: 'Invalid material id' });
        }

        const material = await materialService.getMaterialDetailById(materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        return res.status(200).json({
            data: {
                id: material.id,
                title: material.title,
                type: material.type,
                content: material.content,
                url: material.content_url,
                createdAt: material.created_at
            }
        });
    } catch (error) {
        console.error('Get material detail error:', error);
        return res.status(500).json({ message: 'Failed to get material detail' });
    }
};

exports.getMyLessons = async (req, res) => {
    try {
        const userId = req.user.id;
        const lessons = await materialService.getMyLessons(userId);

        return res.status(200).json({ data: lessons });
    } catch (error) {
        console.error('Get my lessons error:', error);
        return res.status(500).json({ message: 'Failed to get my lessons' });
    }
};