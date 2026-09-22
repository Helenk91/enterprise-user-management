/**
 * 用户控制器：列表 / 详情 / 新增 / 修改 / 删除 / 批量删除 / 导出 CSV
 */
const userService = require('../services/userService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');
const logger = require('../utils/logger');

const ROLES = ['admin', 'user'];
const STATUSES = ['active', 'disabled'];

class UserController {
  /**
   * GET /api/users?page=&pageSize=&keyword=
   */
  async list(req, res, next) {
    try {
      const data = await userService.list(req.query);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/users/:id
   */
  async detail(req, res, next) {
    try {
      const user = await userService.findById(req.params.id);
      if (!user) return ApiResponse.notFound(res, '用户不存在');
      return ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users
   */
  async create(req, res, next) {
    try {
      const { name, email, phone, password, role, gender, department, region, bio } = req.body || {};

      const errors = validator.validateAll([
        { validator: validator.requiredString, args: [name, '姓名'] },
        { validator: validator.email, args: [email] },
        { validator: validator.requiredString, args: [password, '密码'] },
        { validator: validator.phone, args: [phone] },
        { validator: validator.enum, args: [role || 'user', ROLES, '角色'] },
      ]);
      if (errors.length) return ApiResponse.badRequest(res, errors.join('；'));

      if (await userService.emailExists(email)) {
        return ApiResponse.conflict(res, '该邮箱已被占用');
      }

      const user = await userService.create({
        name,
        email,
        phone,
        password,
        role: role || 'user',
        gender,
        department,
        region,
        bio,
      });

      logger.logToDb({
        action: 'USER_CREATE',
        method: req.method,
        path: req.originalUrl,
        detail: `创建用户：${user.name}（${user.email}）`,
        userName: req.user.name,
        ip: req.ip,
      });

      return ApiResponse.created(res, user, '创建成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/users/:id
   */
  async update(req, res, next) {
    try {
      const { name, email, phone, role, status, gender, department, region, bio } = req.body || {};

      const errors = validator.validateAll([
        { validator: validator.requiredString, args: [name, '姓名'] },
        { validator: validator.email, args: [email] },
        { validator: validator.phone, args: [phone] },
        { validator: validator.enum, args: [role || 'user', ROLES, '角色'] },
        { validator: validator.enum, args: [status || 'active', STATUSES, '状态'] },
      ]);
      if (errors.length) return ApiResponse.badRequest(res, errors.join('；'));

      if (await userService.emailExists(email, req.params.id)) {
        return ApiResponse.conflict(res, '该邮箱已被占用');
      }

      const user = await userService.update(req.params.id, {
        name,
        email,
        phone,
        role: role || 'user',
        status: status || 'active',
        gender,
        department,
        region,
        bio,
      });

      logger.logToDb({
        action: 'USER_UPDATE',
        method: req.method,
        path: req.originalUrl,
        detail: `修改用户：${user.name}`,
        userName: req.user.name,
        ip: req.ip,
      });

      return ApiResponse.success(res, user, '修改成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/users/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await userService.remove(req.params.id);
      if (!ok) return ApiResponse.notFound(res, '用户不存在');

      logger.logToDb({
        action: 'USER_DELETE',
        method: req.method,
        path: req.originalUrl,
        detail: `删除用户 ID=${req.params.id}`,
        userName: req.user.name,
        ip: req.ip,
      });

      return ApiResponse.success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/batch-delete  { ids: [] }
   */
  async batchRemove(req, res, next) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return ApiResponse.badRequest(res, '请选择要删除的用户');
      }

      const count = await userService.removeMany(ids.map(Number).filter(Boolean));

      logger.logToDb({
        action: 'USER_BATCH_DELETE',
        method: req.method,
        path: req.originalUrl,
        detail: `批量删除 ${count} 个用户`,
        userName: req.user.name,
        ip: req.ip,
      });

      return ApiResponse.success(res, { deleted: count }, `已删除 ${count} 个用户`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/users/export/csv   导出当前筛选条件下的用户 CSV
   */
  async exportCsv(req, res, next) {
    try {
      const { list } = await userService.list({ ...req.query, pageSize: 1000 });

      const header = ['ID', '姓名', '邮箱', '手机号', '角色', '状态', '创建时间'];
      const rows = list.map((u) => [
        u.id,
        u.name,
        u.email,
        u.phone || '',
        u.role,
        u.status,
        u.created_at ? new Date(u.created_at).toLocaleString('zh-CN') : '',
      ]);

      const csv =
        '\uFEFF' + // BOM，让 Excel 正确识别 UTF-8
        [header, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
