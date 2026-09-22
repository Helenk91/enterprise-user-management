/**
 * 认证控制器：注册 / 登录 / 当前用户 / 登出 / 修改密码
 */
const authService = require('../services/authService');
const userService = require('../services/userService');
const loginHistoryService = require('../services/loginHistoryService');
const sessionService = require('../services/sessionService');
const jwtUtil = require('../utils/jwt');
const tokenBlacklist = require('../middleware/tokenBlacklist');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');
const logger = require('../utils/logger');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body || {};

      const errors = validator.validateAll([
        { validator: validator.requiredString, args: [name, '姓名'] },
        { validator: validator.email, args: [email] },
        { validator: validator.password, args: [password] },
        { validator: validator.phone, args: [phone] },
      ]);
      if (errors.length) return ApiResponse.badRequest(res, errors.join('；'));

      const { user, token } = await authService.register({ name, email, password, phone });

      logger.logToDb({
        action: 'REGISTER',
        method: req.method,
        path: req.originalUrl,
        detail: `新用户注册：${user.name}（${user.email}）`,
        userName: user.name,
        ip: req.ip,
      });

      return ApiResponse.created(res, { user, token }, '注册成功');
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') return ApiResponse.conflict(res, err.message);
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      const errors = validator.validateAll([
        { validator: validator.email, args: [email] },
        { validator: validator.requiredString, args: [password, '密码'] },
      ]);
      if (errors.length) return ApiResponse.badRequest(res, errors.join('；'));

      const { user, token } = await authService.login({
        email,
        password,
        ip: req.ip,
      });

      // 记录登录历史 + 建立在线会话
      const ua = req.headers['user-agent'] || '';
      loginHistoryService.record({
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: ua,
      }).catch(() => {});
      const payload = jwtUtil.verify(token);
      if (payload?.jti) {
        sessionService.create({ userId: user.id, jti: payload.jti, ip: req.ip, userAgent: ua }).catch(() => {});
      }

      logger.logToDb({
        action: 'LOGIN',
        method: req.method,
        path: req.originalUrl,
        detail: `用户登录：${user.name}`,
        userName: user.name,
        ip: req.ip,
      });

      return ApiResponse.success(res, { user, token }, '登录成功');
    } catch (err) {
      if (err.code === 'BAD_CREDENTIALS' || err.code === 'ACCOUNT_DISABLED' || err.code === 'ACCOUNT_LOCKED') {
        return ApiResponse.badRequest(res, err.message);
      }
      next(err);
    }
  }

  /**
   * POST /api/auth/logout  （需登录）
   * 将当前 token 加入黑名单，立即失效
   */
  async logout(req, res, next) {
    try {
      tokenBlacklist.add(req.user);
      sessionService.remove(req.user.jti).catch(() => {});
      logger.logToDb({
        action: 'LOGOUT',
        method: req.method,
        path: req.originalUrl,
        detail: `用户退出登录：${req.user.name}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, null, '已退出登录');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/auth/password  （需登录）
   * 修改密码：验证旧密码 -> 更新 -> 当前 token 失效需重新登录
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body || {};

      const errors = validator.validateAll([
        { validator: validator.requiredString, args: [oldPassword, '原密码'] },
        { validator: validator.password, args: [newPassword, '新密码'] },
      ]);
      if (errors.length) return ApiResponse.badRequest(res, errors.join('；'));

      if (oldPassword === newPassword) {
        return ApiResponse.badRequest(res, '新密码不能与原密码相同');
      }

      await authService.changePassword(req.user.id, { oldPassword, newPassword });

      // 使当前 token 失效并清理会话，强制重新登录
      tokenBlacklist.add(req.user);
      sessionService.remove(req.user.jti).catch(() => {});

      logger.logToDb({
        action: 'PASSWORD_CHANGE',
        method: req.method,
        path: req.originalUrl,
        detail: `修改密码：${req.user.name}`,
        userName: req.user.name,
        ip: req.ip,
      });

      return ApiResponse.success(res, null, '密码修改成功，请重新登录');
    } catch (err) {
      if (err.code === 'OLD_PASSWORD_WRONG') return ApiResponse.badRequest(res, err.message);
      next(err);
    }
  }

  /**
   * GET /api/auth/me  （需登录）
   */
  async me(req, res, next) {
    try {
      const user = await userService.findById(req.user.id);
      if (!user) return ApiResponse.notFound(res, '用户不存在');
      return ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
