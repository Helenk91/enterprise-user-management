/**
 * 个人资料路由
 */
const express = require('express');
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, profileController.get);
router.put('/', auth, profileController.update);
router.put('/avatar', auth, profileController.updateAvatar);
router.get('/stats', auth, profileController.stats);

module.exports = router;
