/**
 * 数据字典控制器
 */
const dictService = require('../services/dictService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');

class DictController {
  /**
   * GET /api/dict/types
   */
  async types(req, res, next) {
    try {
      const list = await dictService.types(req.query);
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/dict/types
   */
  async createType(req, res, next) {
    try {
      const { typeCode, typeName } = req.body || {};
      let err = validator.requiredString(typeCode, '类型编码');
      err = err || validator.requiredString(typeName, '类型名称');
      if (err) return ApiResponse.badRequest(res, err);
      const exist = await dictService.typeByCode(typeCode);
      if (exist) return ApiResponse.conflict(res, '类型编码已存在');
      const type = await dictService.createType(req.body);
      return ApiResponse.created(res, type, '字典类型已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/dict/types/:id
   */
  async updateType(req, res, next) {
    try {
      const type = await dictService.updateType(Number(req.params.id), req.body || {});
      return ApiResponse.success(res, type, '字典类型已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/dict/types/:id
   */
  async removeType(req, res, next) {
    try {
      const ok = await dictService.removeType(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '类型不存在');
      return ApiResponse.success(res, null, '类型已删除（含字典项）');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/dict/items?typeCode=
   */
  async items(req, res, next) {
    try {
      const list = await dictService.items(req.query.typeCode || '');
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/dict/items
   */
  async createItem(req, res, next) {
    try {
      const { typeCode, label, value } = req.body || {};
      let err = validator.requiredString(typeCode, '类型编码');
      err = err || validator.requiredString(label, '字典标签');
      err = err || validator.requiredString(value, '字典值');
      if (err) return ApiResponse.badRequest(res, err);
      const item = await dictService.createItem(req.body);
      return ApiResponse.created(res, item, '字典项已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/dict/items/:id
   */
  async updateItem(req, res, next) {
    try {
      const item = await dictService.updateItem(Number(req.params.id), req.body || {});
      return ApiResponse.success(res, item, '字典项已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/dict/items/:id
   */
  async removeItem(req, res, next) {
    try {
      const ok = await dictService.removeItem(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '字典项不存在');
      return ApiResponse.success(res, null, '字典项已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DictController();
