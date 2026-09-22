/**
 * 菜单管理路由
 */
const express = require('express');
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, menuController.flat);
router.get('/tree', auth, menuController.tree);
router.post('/', auth, menuController.create);
router.put('/:id', auth, menuController.update);
router.delete('/:id', auth, menuController.remove);

module.exports = router;
