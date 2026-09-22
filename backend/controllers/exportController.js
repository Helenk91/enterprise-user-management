/**
 * 导出控制器
 * 服务端 CSV 导出 + 审计分析
 */
const exportService = require('../services/exportService');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 输出 CSV（模块级函数，避免 this 丢失）
 */
function sendCsv(res, csv, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}_${Date.now()}.csv"`);
  res.send(csv);
}

class ExportController {
  /**
   * GET /api/export/users.csv
   */
  async users(req, res, next) {
    try {
      const csv = await exportService.usersCSV();
      sendCsv(res, csv, '用户数据');
      logger.logToDb({ action: 'DATA_EXPORT', method: 'GET', path: '/api/export/users.csv', detail: '导出用户数据', userName: req.user.name, ip: req.ip });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/logs.csv
   */
  async logs(req, res, next) {
    try {
      const csv = await exportService.logsCSV();
      sendCsv(res, csv, '操作日志');
      logger.logToDb({ action: 'DATA_EXPORT', method: 'GET', path: '/api/export/logs.csv', detail: '导出审计日志', userName: req.user.name, ip: req.ip });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/tasks.csv
   */
  async tasks(req, res, next) {
    try {
      const csv = await exportService.tasksCSV();
      sendCsv(res, csv, '任务数据');
      logger.logToDb({ action: 'DATA_EXPORT', method: 'GET', path: '/api/export/tasks.csv', detail: '导出任务数据', userName: req.user.name, ip: req.ip });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/notices.csv
   */
  async notices(req, res, next) {
    try {
      const csv = await exportService.noticesCSV();
      sendCsv(res, csv, '公告数据');
      logger.logToDb({ action: 'DATA_EXPORT', method: 'GET', path: '/api/export/notices.csv', detail: '导出公告数据', userName: req.user.name, ip: req.ip });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/analytics/trend?days=14
   */
  async trend(req, res, next) {
    try {
      const data = await exportService.activityTrend(req.query.days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/analytics/heatmap?days=30
   */
  async heatmap(req, res, next) {
    try {
      const data = await exportService.activityHeatmap(req.query.days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/analytics/actions?days=7
   */
  async actions(req, res, next) {
    try {
      const data = await exportService.actionStats(req.query.days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/export/analytics/hours?days=14
   */
  async hours(req, res, next) {
    try {
      const data = await exportService.hourStats(req.query.days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExportController();
