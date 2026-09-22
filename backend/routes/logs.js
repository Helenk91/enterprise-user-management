/**
 * 日志路由（需要登录）
 */
const express = require('express');
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, logController.list);

module.exports = router;
