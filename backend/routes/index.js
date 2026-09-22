/**
 * 路由汇总
 */
const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const statsRoutes = require('./stats');
const logRoutes = require('./logs');
const profileRoutes = require('./profile');
const securityRoutes = require('./security');
const noticeRoutes = require('./notices');
const taskRoutes = require('./tasks');
const messageRoutes = require('./messages');
const fileRoutes = require('./files');
const dictRoutes = require('./dict');
const roleRoutes = require('./roles');
const menuRoutes = require('./menus');
const settingRoutes = require('./settings');
const extRoutes = require('./ext');
const toolRoutes = require('./tools');
const exportRoutes = require('./export');
const reportRoutes = require('./report');
const selftestRoutes = require('./selftest');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ code: 0, message: 'ok', service: 'user-management-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);
router.use('/logs', logRoutes);
router.use('/profile', profileRoutes);
router.use('/security', securityRoutes);
router.use('/notices', noticeRoutes);
router.use('/tasks', taskRoutes);
router.use('/messages', messageRoutes);
router.use('/files', fileRoutes);
router.use('/dict', dictRoutes);
router.use('/roles', roleRoutes);
router.use('/menus', menuRoutes);
router.use('/settings', settingRoutes);
router.use('/', extRoutes);
router.use('/tools', toolRoutes);
router.use('/export', exportRoutes);
router.use('/report', reportRoutes);
router.use('/selftest', selftestRoutes);

module.exports = router;
