/**
 * 个人资料控制器
 */
const profileService = require('../services/profileService');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class ProfileController {
  /**
   * GET /api/profile
   */
  async get(req, res, next) {
    try {
      const profile = await profileService.getProfile(req.user.id);
      if (!profile) return ApiResponse.notFound(res, '用户不存在');
      return ApiResponse.success(res, profile);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/profile
   */
  async update(req, res, next) {
    try {
      const data = await profileService.updateProfile(req.user.id, req.body || {});
      logger.logToDb({
        action: 'PROFILE_UPDATE',
        method: req.method,
        path: req.originalUrl,
        detail: `更新个人资料：${req.user.name}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, data, '资料更新成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/profile/avatar
   */
  async updateAvatar(req, res, next) {
    try {
      const data = await profileService.updateAvatar(req.user.id, req.body?.avatar);
      return ApiResponse.success(res, data, '头像已更新');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/profile/stats  （分布统计）
   */
  async stats(req, res, next) {
    try {
      const [departments, regions, genders] = await Promise.all([
        profileService.departmentStats(),
        profileService.regionStats(),
        profileService.genderStats(),
      ]);
      return ApiResponse.success(res, { departments, regions, genders });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
