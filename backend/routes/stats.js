/**
 * 统计路由（需要登录）
 */
const express = require('express');
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/overview', auth, statsController.overview);
router.get('/trend', auth, statsController.trend);
router.get('/roles', auth, statsController.roles);

module.exports = router;
