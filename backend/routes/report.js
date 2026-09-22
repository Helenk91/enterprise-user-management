/**
 * 报表路由
 */
const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/core', auth, reportController.core);
router.get('/trend', auth, reportController.trend);
router.get('/distributions', auth, reportController.distributions);
router.get('/task-completion', auth, reportController.taskCompletion);

module.exports = router;
