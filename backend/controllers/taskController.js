/**
 * 待办任务控制器
 */
const taskService = require('../services/taskService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');
const logger = require('../utils/logger');

class TaskController {
  /**
   * GET /api/tasks
   */
  async list(req, res, next) {
    try {
      const data = await taskService.list(req.user.id, req.query);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/board
   */
  async board(req, res, next) {
    try {
      const data = await taskService.board(req.user.id);
      const stats = await taskService.stats(req.user.id);
      return ApiResponse.success(res, { ...data, stats });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/month?year=2026&month=9
   */
  async month(req, res, next) {
    try {
      const data = await taskService.month(req.user.id, req.query.year, req.query.month);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/range?start=2026-09-20&end=2026-09-26
   */
  async range(req, res, next) {
    try {
      const { start, end } = req.query;
      if (!start || !end) return ApiResponse.badRequest(res, '缺少 start/end 参数');
      const data = await taskService.range(req.user.id, String(start), String(end));
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/tasks
   */
  async create(req, res, next) {
    try {
      const err = validator.requiredString(req.body?.title, '任务标题', { min: 1 });
      if (err) return ApiResponse.badRequest(res, err);
      const task = await taskService.create(req.user.id, req.body || {});
      logger.logToDb({
        action: 'TASK_CREATE',
        method: req.method,
        path: req.originalUrl,
        detail: `创建任务：${task.title}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.created(res, task, '任务已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tasks/:id
   */
  async update(req, res, next) {
    try {
      const exists = await taskService.findById(Number(req.params.id), req.user.id);
      if (!exists) return ApiResponse.notFound(res, '任务不存在');
      const task = await taskService.update(Number(req.params.id), req.user.id, req.body || {});
      return ApiResponse.success(res, task, '任务已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/tasks/:id/status
   */
  async changeStatus(req, res, next) {
    try {
      const { status } = req.body || {};
      if (!['todo', 'doing', 'done'].includes(status)) {
        return ApiResponse.badRequest(res, '状态只能是 todo/doing/done');
      }
      const exists = await taskService.findById(Number(req.params.id), req.user.id);
      if (!exists) return ApiResponse.notFound(res, '任务不存在');
      const task = await taskService.changeStatus(Number(req.params.id), req.user.id, status);
      return ApiResponse.success(res, task, '状态已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/tasks/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await taskService.remove(Number(req.params.id), req.user.id);
      if (!ok) return ApiResponse.notFound(res, '任务不存在');
      return ApiResponse.success(res, null, '任务已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
