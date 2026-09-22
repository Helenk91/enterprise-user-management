/**
 * 待办任务路由
 */
const express = require('express');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, taskController.list);
router.get('/board', auth, taskController.board);
router.get('/month', auth, taskController.month);
router.get('/range', auth, taskController.range);
router.post('/', auth, taskController.create);
router.put('/:id', auth, taskController.update);
router.patch('/:id/status', auth, taskController.changeStatus);
router.delete('/:id', auth, taskController.remove);

module.exports = router;
