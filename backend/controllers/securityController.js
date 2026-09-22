/**
 * 登录历史 / 会话控制器
 */
const loginHistoryService = require('../services/loginHistoryService');
const sessionService = require('../services/sessionService');
const tokenBlacklist = require('../middleware/tokenBlacklist');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class SecurityController {
  /**
   * GET /api/login-history
   */
  async history(req, res, next) {
    try {
      const data = await loginHistoryService.listByUser(req.user.id, req.query);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/sessions  （当前用户会话）
   */
  async sessions(req, res, next) {
    try {
      const list = await sessionService.listByUser(req.user.id);
      const current = req.user.jti;
      return ApiResponse.success(
        res,
        list.map((s) => ({ ...s, current: s.jti === current }))
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/sessions/:id  （踢下线，不能踢自己）
   */
  async revoke(req, res, next) {
    try {
      const id = Number(req.params.id);
      const list = await sessionService.listByUser(req.user.id);
      const target = list.find((s) => s.id === id);
      if (!target) return ApiResponse.notFound(res, '会话不存在');
      if (target.jti === req.user.jti) {
        return ApiResponse.badRequest(res, '不能下线当前会话，请使用退出登录');
      }
      await sessionService.remove(target.jti);
      tokenBlacklist.add({ jti: target.jti });
      logger.logToDb({
        action: 'SESSION_KICK',
        method: req.method,
        path: req.originalUrl,
        detail: `下线会话 #${id}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, null, '该会话已下线');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SecurityController();
