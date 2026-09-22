/**
 * 通知公告控制器
 */
const noticeService = require('../services/noticeService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');
const logger = require('../utils/logger');

class NoticeController {
  /**
   * GET /api/notices
   */
  async list(req, res, next) {
    try {
      const data = await noticeService.list(req.query);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notices/latest
   */
  async latest(req, res, next) {
    try {
      const list = await noticeService.latest();
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notices/:id
   */
  async detail(req, res, next) {
    try {
      const notice = await noticeService.findById(Number(req.params.id));
      if (!notice) return ApiResponse.notFound(res, '公告不存在');
      return ApiResponse.success(res, notice);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/notices
   */
  async create(req, res, next) {
    try {
      const { title, content } = req.body || {};
      const err = validator.requiredString(title, '标题', { min: 2 });
      if (err) return ApiResponse.badRequest(res, err);
      const notice = await noticeService.create({ ...req.body, author: req.user.name });
      logger.logToDb({
        action: 'NOTICE_CREATE',
        method: req.method,
        path: req.originalUrl,
        detail: `发布公告：${title}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.created(res, notice, '公告已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/notices/:id
   */
  async update(req, res, next) {
    try {
      const exists = await noticeService.findById(Number(req.params.id));
      if (!exists) return ApiResponse.notFound(res, '公告不存在');
      const notice = await noticeService.update(Number(req.params.id), req.body || {});
      logger.logToDb({
        action: 'NOTICE_UPDATE',
        method: req.method,
        path: req.originalUrl,
        detail: `修改公告：${notice.title}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, notice, '公告已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notices/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await noticeService.remove(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '公告不存在');
      logger.logToDb({
        action: 'NOTICE_DELETE',
        method: req.method,
        path: req.originalUrl,
        detail: `删除公告 #${req.params.id}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, null, '公告已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NoticeController();
