/**
 * 角色权限路由
 */
const express = require('express');
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, roleController.list);
router.post('/', auth, roleController.create);
router.put('/:id', auth, roleController.update);
router.delete('/:id', auth, roleController.remove);
router.get('/permissions', auth, roleController.permissions);
router.get('/:id/permissions', auth, roleController.rolePerms);
router.put('/:id/permissions', auth, roleController.assignPerms);

module.exports = router;
