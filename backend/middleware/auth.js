/**
 * 鉴权中间件
 * 校验 Authorization: Bearer <token>，检查黑名单，挂载用户信息到 req.user
 */
const jwtUtil = require('../utils/jwt');
const tokenBlacklist = require('./tokenBlacklist');
const ApiResponse = require('../utils/response');

module.exports = function auth(req, res, next) {
  const token = jwtUtil.extract(req);
  const payload = token ? jwtUtil.verify(token) : null;

  if (!payload) {
    return ApiResponse.unauthorized(res);
  }

  // 已登出的 token 视为无效
  if (tokenBlacklist.has(payload.jti)) {
    return ApiResponse.unauthorized(res, '登录状态已失效，请重新登录');
  }

  req.user = {
    id: payload.id,
    name: payload.name,
    role: payload.role,
    jti: payload.jti,
  };
  next();
};
