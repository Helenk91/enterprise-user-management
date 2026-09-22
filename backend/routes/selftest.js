/**
 * 系统自测路由
 */
const express = require('express');
const selftestController = require('../controllers/selftestController');
const auth = require('../middleware/auth');
const requirePerm = require('../middleware/requirePerm');

const router = express.Router();

router.post('/run', auth, requirePerm('admin'), selftestController.run);

module.exports = router;
