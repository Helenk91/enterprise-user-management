/**
 * 系统配置路由
 */
const express = require('express');
const settingController = require('../controllers/settingController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, settingController.all);
router.post('/', auth, settingController.create);
router.put('/:id', auth, settingController.update);
router.delete('/:id', auth, settingController.remove);

module.exports = router;
