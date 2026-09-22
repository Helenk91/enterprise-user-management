/**
 * 报表控制器
 */
const reportService = require('../services/reportService');
const ApiResponse = require('../utils/response');

class ReportController {
  /**
   * GET /api/report/core
   */
  async core(req, res, next) {
    try {
      const data = await reportService.core();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/report/trend?days=7
   */
  async trend(req, res, next) {
    try {
      const data = await reportService.trend(req.query.days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/report/distributions
   */
  async distributions(req, res, next) {
    try {
      const data = await reportService.distributions();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/report/task-completion
   */
  async taskCompletion(req, res, next) {
    try {
      const data = await reportService.taskCompletion();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
