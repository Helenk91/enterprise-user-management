/**
 * 扩展统计 / 监控 / 导入 控制器
 */
const dashboardService = require('../services/dashboardService');
const monitorService = require('../services/monitorService');
const profileService = require('../services/profileService');
const sessionService = require('../services/sessionService');
const userService = require('../services/userService');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class ExtController {
  /**
   * GET /api/dashboard/monthly?months=6
   */
  async monthly(req, res, next) {
    try {
      const list = await dashboardService.monthlyRegistrations(req.query.months);
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/heatmap?days=30
   */
  async heatmap(req, res, next) {
    try {
      const list = await dashboardService.activityHeatmap(req.query.days);
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/actions?days=7
   */
  async actions(req, res, next) {
    try {
      const list = await dashboardService.actionDistribution(req.query.days);
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dashboard/system
   */
  async system(req, res, next) {
    try {
      const overview = await dashboardService.systemOverview();
      const [departments, regions, genders] = await Promise.all([
        profileService.departmentStats(),
        profileService.regionStats(),
        profileService.genderStats(),
      ]);
      return ApiResponse.success(res, { ...overview, departments, regions, genders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/monitor/server
   */
  async server(req, res, next) {
    try {
      const info = await monitorService.serverInfo();
      const online = await sessionService.onlineCount();
      return ApiResponse.success(res, { ...info, online });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/monitor/online
   */
  async online(req, res, next) {
    try {
      const users = await sessionService.onlineUsers();
      const count = await sessionService.onlineCount();
      return ApiResponse.success(res, { count, users });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/import  { rows: [...] }
   */
  async importUsers(req, res, next) {
    try {
      const rows = req.body?.rows || [];
      if (!rows.length) return ApiResponse.badRequest(res, '导入数据为空');
      const result = await userService.bulkCreate(rows);
      logger.logToDb({
        action: 'USER_IMPORT',
        method: req.method,
        path: req.originalUrl,
        detail: `批量导入用户：成功 ${result.success} 条，失败 ${result.failures.length} 条`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, result, `导入完成：成功 ${result.success} 条，失败 ${result.failures.length} 条`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/batch-status  { ids: [], status: 'active'|'disabled' }
   */
  async batchStatus(req, res, next) {
    try {
      const { ids = [], status } = req.body || {};
      if (!ids.length) return ApiResponse.badRequest(res, '请选择用户');
      if (!['active', 'disabled'].includes(status)) return ApiResponse.badRequest(res, '状态不合法');
      const affected = await userService.bulkStatus(ids, status);
      logger.logToDb({
        action: 'USER_BATCH_STATUS',
        method: req.method,
        path: req.originalUrl,
        detail: `批量${status === 'active' ? '启用' : '禁用'} ${affected} 个用户`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, { affected }, `已${status === 'active' ? '启用' : '禁用'} ${affected} 个用户`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/:id/reset-password  { password }
   */
  async resetPassword(req, res, next) {
    try {
      const { password } = req.body || {};
      const validator = require('../utils/validator');
      const err = validator.password(password, '新密码');
      if (err) return ApiResponse.badRequest(res, err);
      await userService.resetPassword(Number(req.params.id), password);
      logger.logToDb({
        action: 'PASSWORD_RESET',
        method: req.method,
        path: req.originalUrl,
        detail: `重置用户 #${req.params.id} 的密码`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, null, '密码已重置');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExtController();
