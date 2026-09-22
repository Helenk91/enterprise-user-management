/**
 * 消息中心路由
 */
const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, messageController.list);
router.get('/unread-count', auth, messageController.unreadCount);
router.post('/', auth, messageController.create);
router.put('/read-all', auth, messageController.markAllRead);
router.put('/:id/read', auth, messageController.markRead);
router.delete('/:id', auth, messageController.remove);

module.exports = router;
