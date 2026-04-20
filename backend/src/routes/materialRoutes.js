const express = require('express');
const materialController = require('../controllers/materialController');

const router = express.Router();

router.get('/', materialController.getMaterials);
router.get('/:id', materialController.getMaterialDetail);

module.exports = router;