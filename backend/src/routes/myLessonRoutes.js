const express = require('express');
const auth = require('../middleware/authMiddleware');
const materialController = require('../controllers/materialController');

const router = express.Router();

router.get('/', auth, materialController.getMyLessons);
router.get('/saved', auth, materialController.getSavedMaterials);
router.get('/favorite', auth, materialController.getFavoriteMaterials);
router.post('/:materialId/save', auth, materialController.saveMaterial);
router.delete('/:materialId/save', auth, materialController.unsaveMaterial);
router.post('/:materialId/favorite', auth, materialController.favoriteMaterial);
router.delete('/:materialId/favorite', auth, materialController.unfavoriteMaterial);

module.exports = router;