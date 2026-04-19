const express = require('express');
const auth = require('../middleware/authMiddleware');
const materialController = require('../controllers/materialController');

const router = express.Router();

router.get('/', auth, materialController.getMyLessons);

module.exports = router;