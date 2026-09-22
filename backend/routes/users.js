/**
 * 用户路由（全部需要登录）
 */
const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// 注意：/export/csv 与 /batch-delete 必须定义在 /:id 之前
router.get('/export/csv', auth, userController.exportCsv);
router.post('/batch-delete', auth, userController.batchRemove);

router.get('/', auth, userController.list);
router.get('/:id', auth, userController.detail);
router.post('/', auth, userController.create);
router.put('/:id', auth, userController.update);
router.delete('/:id', auth, userController.remove);

module.exports = router;
