/**
 * 文件管理路由
 */
const express = require('express');
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/tree', auth, fileController.tree);
router.get('/stats', auth, fileController.stats);
router.get('/', auth, fileController.list);
router.post('/', auth, fileController.create);
router.post('/folder', auth, fileController.createFolder);
router.get('/:id/download', auth, fileController.download);
router.post('/:id/download', auth, fileController.download);
router.delete('/:id', auth, fileController.remove);
router.delete('/folder/:id', auth, fileController.removeFolder);

module.exports = router;
