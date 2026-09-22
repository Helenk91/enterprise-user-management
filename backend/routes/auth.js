/**
 * 认证路由
 */
const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const loginRateLimit = require('../middleware/loginRateLimit');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', loginRateLimit, authController.login);
router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);
router.put('/password', auth, authController.changePassword);

module.exports = router;
