/**
 * 消息中心控制器
 */
const messageService = require('../services/messageService');
const ApiResponse = require('../utils/response');

class MessageController {
  /**
   * GET /api/messages
   */
  async list(req, res, next) {
    try {
      const data = await messageService.list(req.user.id, req.query);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/messages/unread-count
   */
  async unreadCount(req, res, next) {
    try {
      const cnt = await messageService.unreadCount(req.user.id);
      return ApiResponse.success(res, { count: cnt });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/messages  发送消息（管理员/系统）
   */
  async create(req, res, next) {
    try {
      const { toUserId, fromUser = '系统', title, content, type = 'system' } = req.body || {};
      if (!toUserId || !title || !content) return ApiResponse.badRequest(res, '缺少接收人/标题/内容');
      const msg = await messageService.send({ toUserId: Number(toUserId), fromUser, title, content, type });
      return ApiResponse.created(res, msg, '消息已发送');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/messages/:id/read
   */
  async markRead(req, res, next) {
    try {
      await messageService.markRead(Number(req.params.id), req.user.id);
      const count = await messageService.unreadCount(req.user.id);
      return ApiResponse.success(res, { unread: count }, '已标记已读');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/messages/read-all
   */
  async markAllRead(req, res, next) {
    try {
      await messageService.markAllRead(req.user.id);
      return ApiResponse.success(res, { unread: 0 }, '全部已读');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/messages/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await messageService.remove(Number(req.params.id), req.user.id);
      if (!ok) return ApiResponse.notFound(res, '消息不存在');
      const count = await messageService.unreadCount(req.user.id);
      return ApiResponse.success(res, { unread: count }, '消息已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessageController();
