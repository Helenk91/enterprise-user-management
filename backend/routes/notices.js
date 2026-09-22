/**
 * 通知公告路由
 */
const express = require('express');
const noticeController = require('../controllers/noticeController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, noticeController.list);
router.get('/latest', auth, noticeController.latest);
router.get('/:id', auth, noticeController.detail);
router.post('/', auth, noticeController.create);
router.put('/:id', auth, noticeController.update);
router.delete('/:id', auth, noticeController.remove);

module.exports = router;
