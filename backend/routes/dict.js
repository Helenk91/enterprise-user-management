/**
 * 数据字典路由
 */
const express = require('express');
const dictController = require('../controllers/dictController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/types', auth, dictController.types);
router.post('/types', auth, dictController.createType);
router.put('/types/:id', auth, dictController.updateType);
router.delete('/types/:id', auth, dictController.removeType);
router.get('/items', auth, dictController.items);
router.post('/items', auth, dictController.createItem);
router.put('/items/:id', auth, dictController.updateItem);
router.delete('/items/:id', auth, dictController.removeItem);

module.exports = router;
