/**
 * 统计控制器
 */
const statsService = require('../services/statsService');
const ApiResponse = require('../utils/response');

class StatsController {
  /**
   * GET /api/stats/overview
   */
  async overview(req, res, next) {
    try {
      const data = await statsService.overview();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/stats/trend?days=7
   */
  async trend(req, res, next) {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
      const data = await statsService.registerTrend(days);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/stats/roles
   */
  async roles(req, res, next) {
    try {
      const data = await statsService.roleDistribution();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatsController();
