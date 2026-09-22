/**
 * 菜单管理控制器
 */
const menuService = require('../services/menuService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');

class MenuController {
  /**
   * GET /api/menus/tree
   */
  async tree(req, res, next) {
    try {
      const tree = await menuService.tree();
      return ApiResponse.success(res, tree);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/menus  （扁平列表）
   */
  async flat(req, res, next) {
    try {
      const list = await menuService.flat();
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/menus
   */
  async create(req, res, next) {
    try {
      const err = validator.requiredString(req.body?.name, '菜单名称');
      if (err) return ApiResponse.badRequest(res, err);
      const menu = await menuService.create(req.body || {});
      return ApiResponse.created(res, menu, '菜单已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/menus/:id
   */
  async update(req, res, next) {
    try {
      const menu = await menuService.update(Number(req.params.id), req.body || {});
      return ApiResponse.success(res, menu, '菜单已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/menus/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await menuService.remove(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '菜单不存在');
      return ApiResponse.success(res, null, '菜单已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MenuController();
