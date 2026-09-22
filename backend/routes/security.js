/**
 * 登录历史 / 会话路由
 */
const express = require('express');
const securityController = require('../controllers/securityController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/login-history', auth, securityController.history);
router.get('/sessions', auth, securityController.sessions);
router.delete('/sessions/:id', auth, securityController.revoke);

module.exports = router;
