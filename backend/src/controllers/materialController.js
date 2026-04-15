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
        const msg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message;

        setError(`❌ ${msg}`);
    }
};