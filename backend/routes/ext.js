/**
 * 扩展功能路由：仪表盘增强 / 监控 / 导入 / 批量操作
 */
const express = require('express');
const extController = require('../controllers/extController');
const auth = require('../middleware/auth');

const router = express.Router();

// 仪表盘增强
router.get('/dashboard/monthly', auth, extController.monthly);
router.get('/dashboard/heatmap', auth, extController.heatmap);
router.get('/dashboard/actions', auth, extController.actions);
router.get('/dashboard/system', auth, extController.system);

// 监控
router.get('/monitor/server', auth, extController.server);
router.get('/monitor/online', auth, extController.online);

// 用户批量能力
router.post('/users/import', auth, extController.importUsers);
router.post('/users/batch-status', auth, extController.batchStatus);
router.post('/users/:id/reset-password', auth, extController.resetPassword);

module.exports = router;
