/**
 * 系统自测控制器
 */
const selftestService = require('../services/selftestService');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class SelfTestController {
  /**
   * POST /api/selftest/run  执行全链路自检（管理员）
   */
  async run(req, res, next) {
    try {
      const result = await selftestService.runAll();
      logger.logToDb?.({
        action: 'SELF_TEST_RUN',
        method: req.method,
        path: req.originalUrl,
        detail: `系统自测：${result.summary.pass}/${result.summary.total} 项通过，耗时 ${result.summary.elapsed}ms`,
        userName: req.user?.name || 'system',
        ip: req.ip,
      });
      return ApiResponse.success(res, result, `自测完成：${result.summary.pass}/${result.summary.total} 项通过`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SelfTestController();
