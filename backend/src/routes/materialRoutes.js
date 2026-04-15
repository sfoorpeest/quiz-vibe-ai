const express = require('express');
const materialController = require('../controllers/materialController');

const router = express.Router();

router.get('/', materialController.getMaterials);

module.exports = router;