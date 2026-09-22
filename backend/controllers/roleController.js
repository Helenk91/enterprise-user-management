/**
 * 角色权限控制器
 */
const roleService = require('../services/roleService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');

class RoleController {
  /**
   * GET /api/roles
   */
  async list(req, res, next) {
    try {
      const list = await roleService.list();
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/roles
   */
  async create(req, res, next) {
    try {
      const { roleCode, roleName } = req.body || {};
      let err = validator.requiredString(roleCode, '角色编码');
      err = err || validator.requiredString(roleName, '角色名称');
      if (err) return ApiResponse.badRequest(res, err);
      const role = await roleService.create(req.body);
      return ApiResponse.created(res, role, '角色已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/roles/:id
   */
  async update(req, res, next) {
    try {
      const role = await roleService.update(Number(req.params.id), req.body || {});
      return ApiResponse.success(res, role, '角色已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/roles/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await roleService.remove(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '角色不存在');
      return ApiResponse.success(res, null, '角色已删除');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/roles/permissions  （权限点按模块分组）
   */
  async permissions(req, res, next) {
    try {
      const groups = await roleService.permissions();
      return ApiResponse.success(res, groups);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/roles/:id/permissions
   */
  async rolePerms(req, res, next) {
    try {
      const ids = await roleService.rolePermIds(Number(req.params.id));
      return ApiResponse.success(res, { permIds: ids });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/roles/:id/permissions  { permIds: [] }
   */
  async assignPerms(req, res, next) {
    try {
      const count = await roleService.assignPerms(Number(req.params.id), req.body?.permIds);
      return ApiResponse.success(res, { assigned: count }, `已分配 ${count} 项权限`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoleController();
