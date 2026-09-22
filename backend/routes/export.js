/**
 * 导出与数据分析路由
 */
const express = require('express');
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');
const requirePerm = require('../middleware/requirePerm');

const router = express.Router();

// CSV 导出（审计）
router.get('/users.csv', auth, requirePerm('export:data'), exportController.users);
router.get('/logs.csv', auth, requirePerm('export:data'), exportController.logs);
router.get('/tasks.csv', auth, requirePerm('export:data'), exportController.tasks);
router.get('/notices.csv', auth, requirePerm('export:data'), exportController.notices);

// 数据分析
router.get('/analytics/trend', auth, exportController.trend);
router.get('/analytics/heatmap', auth, exportController.heatmap);
router.get('/analytics/actions', auth, exportController.actions);
router.get('/analytics/hours', auth, exportController.hours);

module.exports = router;
