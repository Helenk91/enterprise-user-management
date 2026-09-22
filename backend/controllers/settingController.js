/**
 * 系统配置控制器
 */
const settingService = require('../services/settingService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');

class SettingController {
  /**
   * GET /api/settings  （全部配置；普通用户只返回公共项）
   */
  async all(req, res, next) {
    try {
      const list = await settingService.all();
      const filtered = req.user.role === 'admin' ? list : list.filter((s) => s.config_key.startsWith('site.'));
      return ApiResponse.success(res, filtered);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/settings
   */
  async create(req, res, next) {
    try {
      const err = validator.requiredString(req.body?.configKey, '配置键');
      if (err) return ApiResponse.badRequest(res, err);
      const setting = await settingService.set(req.body.configKey, req.body.configValue || '', req.body.description);
      return ApiResponse.created(res, setting, '配置已保存');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/settings/:id
   */
  async update(req, res, next) {
    try {
      const list = await settingService.all();
      const target =
        list.find((s) => s.id === Number(req.params.id)) || list.find((s) => s.config_key === String(req.params.id));
      if (!target) return ApiResponse.notFound(res, '配置不存在');
      const setting = await settingService.set(target.config_key, req.body?.configValue ?? target.config_value, req.body?.description);
      return ApiResponse.success(res, setting, '配置已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/settings/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await settingService.remove(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '配置不存在');
      return ApiResponse.success(res, null, '配置已删除');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingController();
