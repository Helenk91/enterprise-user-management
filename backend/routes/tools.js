/**
 * 系统工具路由
 */
const express = require('express');
const toolController = require('../controllers/toolController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/health', auth, toolController.health);
router.get('/ping', auth, toolController.ping);
router.get('/tables', auth, toolController.tables);
router.get('/row-counts', auth, toolController.rowCounts);
router.get('/api-list', auth, toolController.apiList);
router.get('/cache-stats', auth, toolController.cacheStats);

module.exports = router;
